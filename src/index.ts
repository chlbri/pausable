import { Subject } from 'rxjs/internal/Subject';
import type { Command, Delayed, State, SubArgs } from './types';
import { perform as _perform } from './helpers';
import { Observable, Observer } from 'rxjs';

/**
 * Internal class that backs the {@linkcode Pausable} public type.
 *
 * The constructor is private — use {@linkcode createPausable} to obtain an
 * instance.
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
      complete: this.stop,

      error: (value: unknown) => {
        this.#subject$.error(value);
        this.stop();
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
        this.stop();
      },
      complete: () => {
        // Only forward completion immediately if we have never been paused.
        // If we have been paused, buffered events may still need replay.
        if (!this.#hasBeenPaused) {
          this.stop();
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
    this.#events.length = 0;
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
    const actions = this.#resumeActions;

    for (const { delay, value, isError, isComplete } of this.#events) {
      const timeout = delay - this.#lastPaused;

      const timer = setTimeout(() => {
        return this.#perform(timer, () => {
          if (isError) return actions.error(value);
          if (isComplete) return actions.complete();
          return actions.next(value);
        });
      }, timeout);
    }
  };

  /**
   * Subscribes an additional observer to the internal subject.
   *
   * Unlike the observer passed to {@linkcode createPausable}, this subscriber
   * is registered dynamically and receives the same forwarded events subject
   * to the same pause/resume/stop lifecycle controls.
   *
   * @param observer - The subscriber to add. Accepts either a plain `next`
   *   callback or a partial {@linkcode Observer}.
   * @returns An RxJS `Subscription` that can be used to unsubscribe.
   */
  subscribe = (observer: SubArgs<T>) => {
    return this.#subject$.subscribe(observer as Parameters<Subject<T>['subscribe']>[0]);
  };

  /**
   * Dispatches a no-argument lifecycle command by name.
   *
   * Equivalent to calling the corresponding method directly. Useful when
   * the command is determined dynamically.
   *
   * @param action - The {@linkcode Command} to execute.
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
 * Creates a {@linkcode Pausable} wrapper around a source RxJS observable.
 *
 * The returned object lets you `start`, `stop`, `pause`, and `resume`
 * the flow of events from `source$` to `observer`. Events that
 * arrive while the instance is paused are timestamped and buffered; when
 * `resume` is called they are replayed to the observer with their original
 * relative timing preserved.
 *
 * @template T - The value type emitted by the source observable.
 *
 * @param source$ - The RxJS observable whose emissions should be controlled.
 * @param observer - Optional subscriber that receives forwarded events.
 *   Accepts either a plain `next` callback or a partial {@linkcode Observer}.
 *
 * @returns A {@linkcode Pausable} instance exposing lifecycle controls and a
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
 * ```
 */
export const createPausable: CreatePausable_F = (source$, observer) => {
  return new Pausable(source$, observer);
};

export * from './types';
