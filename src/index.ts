import { Subject } from 'rxjs/internal/Subject';
import type { Command, Delayed, State, SubArgs } from './types';
import { perform as _perform } from './helpers';
import { Observable, Observer } from 'rxjs';

/**
 * Internal class that backs the {@link Pausable} public type.
 *
 * The constructor is private — use {@link createPausable} to obtain an
 * instance. All mutable run-time state is scoped to each `start()` / `renew()`
 * call so that consecutive runs are fully isolated from one another.
 *
 * @template T - The value type emitted by the source observable.
 */
class Pausable<T = any> {
  readonly #source$: Observable<T>;
  readonly #observer: SubArgs<T> | undefined;
  readonly #subject$: Subject<T>;
  #lastPaused = Date.now();
  #hasBeenPaused = false;
  #events: Delayed<T>[] = [];
  #command: Command = 'stop';

  constructor(source$: Observable<T>, observer: SubArgs<T> | undefined) {
    this.#source$ = source$;
    this.#observer = observer;
    this.#subject$ = new Subject<T>();
  }

  #canClear = () => this.#command === 'pause' || this.#command === 'stop';

  #perform(timer: ReturnType<typeof setTimeout>, action: () => void) {
    return _perform(timer, this.#canClear, () => {
      action();
      this.#events.shift();
    });
  }

  get #resumeActions() {
    return {
      next: (value: T) => this.#subject$.next(value),

      error: (value: unknown) => {
        this.#subject$.error(value);
        this.#command = 'stop';
        this.#subject$.complete();
      },

      complete: () => {
        this.#subject$.complete();
        this.#command = 'stop';
        this.#events.shift();
      },
    };
  }

  #boot() {
    this.#command = 'start';
    this.#events = [];
    this.#lastPaused = Date.now();
    this.#hasBeenPaused = false;

    const arrayObserver: Observer<T> = {
      next: value => {
        this.#events.push({ delay: Date.now(), value, isError: false });
      },
      error: value => {
        this.#events.push({ delay: Date.now(), value, isError: true });
      },
      complete: () => {
        this.#events.push({
          delay: Date.now(),
          value: undefined as T,
          isError: false,
          isComplete: true,
        });
      },
    };

    const startObserver: Observer<T> = {
      next: value => {
        if (this.#canClear()) return;
        this.#subject$.next(value);
        this.#events.shift();
      },
      error: value => {
        if (this.#canClear()) return;
        this.#subject$.error(value);
        this.#events.shift();
      },
      complete: () => {
        // Only forward completion immediately if we have never been paused.
        // If we have been paused, buffered events may still need replay.
        if (!this.#hasBeenPaused) {
          this.#command = 'stop';
          this.#subject$.complete();
          this.#events.shift();
        }
      },
    };

    this.#source$.subscribe(arrayObserver);
    this.#subject$.subscribe(this.#observer);
    this.#source$.subscribe(startObserver);
  }

  /**
   * Starts consuming the bound source observable and forwarding its events
   * to the observer.
   *
   * Has no effect if the instance is not currently in the `'stopped'` state.
   * To switch to a different source observable, use {@link renew} instead.
   */
  start = () => {
    if (this.#command !== 'stop') return;
    this.#boot();
  };

  /**
   * Stops the stream. Cancels any pending resume timers by flipping
   * `#command` to `'stop'` (which makes `#canClear` return `true`).
   * Has no effect if the instance is already stopped.
   */
  stop = () => {
    if (this.#command === 'stop') return;
    this.#subject$.complete();
    this.#command = 'stop';
  };

  /**
   * Suspends event dispatching while continuing to buffer incoming events.
   *
   * Records the current timestamp as `#lastPaused` (only on the first pause
   * of the current run) so that `resume()` can compute correct replay delays.
   * Has no effect if the instance is already paused or stopped.
   */
  pause = () => {
    if (this.#canClear()) return;
    this.#command = 'pause';

    if (!this.#hasBeenPaused) {
      this.#lastPaused = Date.now();
      this.#hasBeenPaused = true;
    }
  };

  /**
   * Replays all buffered events and then resumes live forwarding.
   *
   * Each buffered event is scheduled via `setTimeout` using its original
   * timestamp relative to `#lastPaused`, preserving the source's timing.
   * The timers are guarded by `#canClear`: if the instance is paused or
   * stopped again before a timer fires, that timer is cancelled.
   *
   * Has no effect if the instance is not currently paused.
   */
  resume = () => {
    if (this.#command !== 'pause') return;
    this.#command = 'resume';

    for (const { delay, value, isError, isComplete } of this.#events) {
      const timeout = delay - this.#lastPaused;

      const timer = setTimeout(() => {
        return this.#perform(timer, () => {
          const actions = this.#resumeActions;
          if (isError) return actions.error(value);
          if (isComplete) return actions.complete();
          return actions.next(value);
        });
      }, timeout);
    }
  };

  /**
   * Stops the current run (if any), replaces the bound source observable
   * with `newSource$`, resets all internal state, and immediately starts a
   * fresh subscription to the new source.
   *
   * The original observer supplied to {@link createPausable} is preserved
   * and re-subscribed to the new internal subject automatically.
   *
   * This is the **only** way to change the source observable after a
   * {@link createPausable} call. Unlike `stop()` + `start()`, `renew()`
   * swaps the underlying observable before starting.
   *
   * @param newSource$ - The new RxJS observable to wrap.
   */
  renew = (newSource$: Observable<T>, observer = this.#observer) => {
    this.stop();
    const out = new Pausable(newSource$, observer);
    // Cancel any in-flight timers from the previous run.
    return out;
  };

  /**
   * Dispatches a no-argument lifecycle command by name.
   *
   * Equivalent to calling the corresponding method directly. Useful when
   * the command is determined dynamically.
   *
   * Note: `renew` cannot be dispatched here because it requires a
   * `newSource$` argument. Call `pausable.renew(obs$)` directly.
   *
   * @param action - The {@link Command} to execute.
   */
  command = (action: Command) => {
    return this[action]();
  };

  /**
   * The current observable state of the instance, derived from `#command`.
   *
   * - `'stopped'` when `#command` is `'stop'`.
   * - `'running'` when `#command` is `'start'` or `'resume'`.
   * - `'paused'`  when `#command` is `'pause'`.
   */
  get state(): State {
    return this.#command === 'stop'
      ? 'stopped'
      : this.#command === 'start' || this.#command === 'resume'
        ? 'running'
        : 'paused';
  }
}

export type { Pausable };

export type CreatePausable_F = <T = any>(
  source$: Observable<T>,
  observer?: SubArgs<T>,
) => Pausable<T>;

/**
 * Creates a {@link Pausable} wrapper around a source RxJS observable.
 *
 * The returned object lets you `start`, `stop`, `pause`, `resume`, and
 * `renew` the flow of events from `source$` to `observer`. Events that
 * arrive while the instance is paused are timestamped and buffered; when
 * `resume` is called they are replayed to the observer with their original
 * relative timing preserved.
 *
 * The source observable and internal subject are **constant per run** —
 * `start()` always uses the observable that was active when the last
 * `renew()` was called (or the one passed here). To switch to a different
 * observable, call `renew(newSource$)`.
 *
 * @template T - The value type emitted by the source observable.
 *
 * @param source$ - The RxJS observable whose emissions should be controlled.
 * @param observer - Optional subscriber that receives forwarded events.
 *   Accepts either a plain `next` callback or a partial {@link Observer}.
 *
 * @returns A {@link Pausable} instance exposing lifecycle controls and a
 *   read-only `state` property.
 *
 * @example
 * ```ts
 * import { interval } from 'rxjs';
 * import { createPausable } from '@bemedev/rx-pausable';
 *
 * const pausable = createPausable(interval(1000), value => console.log(value));
 * pausable.start();
 *
 * setTimeout(() => pausable.pause(),  3500);
 * setTimeout(() => pausable.resume(), 6000);
 * setTimeout(() => pausable.stop(),   9000);
 *
 * // Switch to a new source and restart cleanly:
 * setTimeout(() => pausable.renew(interval(500)), 10000);
 * ```
 */
export const createPausable: CreatePausable_F = (source$, observer) => {
  return new Pausable(source$, observer);
};

export * from './types';
