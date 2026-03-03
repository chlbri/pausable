import { Subject } from 'rxjs/internal/Subject';
import type { Command, CreatePausable_F, Delayed } from './types';
import { perform as _perform } from './helpers';
import { Observer } from 'rxjs';

/**
 * Creates a {@link Pausable} wrapper around a source RxJS observable.
 *
 * The returned object lets you `start`, `stop`, `pause`, and `resume` the
 * flow of events from `source$` to `observer`. Events that arrive while the
 * instance is paused are timestamped and buffered; when `resume` is called
 * they are replayed to the observer with their original relative timing
 * preserved.
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
 * import { createPausable } from './index';
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
  let lastPaused = Date.now();
  const events: Delayed[] = [];

  source$.subscribe({
    next: value => {
      events.push({
        delay: Date.now(),
        value,
        isError: false,
      });
    },
    error: value => {
      events.push({
        delay: Date.now(),
        value,
        isError: true,
      });
    },
    complete: () => {
      events.push({
        delay: Date.now(),
        value: undefined,
        isError: false,
        isComplete: true,
      });
    },
  });

  let command: Command = 'stop';

  const subject$ = new Subject<any>();
  subject$.subscribe(observer);

  let hasBeenPaused = false;

  const canClear = () => command === 'pause' || command === 'stop';

  const perform = (
    timer: ReturnType<typeof setTimeout>,
    action: () => void,
  ) => {
    return _perform(timer, canClear, () => {
      action();
      return events.shift();
    });
  };

  const RESUME_ACTIONS = {
    next: (value: any) => subject$.next(value),

    error: (value: any) => {
      subject$.error(value);
      return subject$.complete();
    },

    complete: () => {
      subject$.complete();
      command = 'stop';
    },
  };

  const startObserver: Observer<any> = {
    next: value => {
      if (canClear()) return;
      subject$.next(value);
      events.shift();
    },
    error: value => {
      if (canClear()) return;
      subject$.error(value);
      events.shift();
    },
    complete: () => {
      if (!hasBeenPaused) {
        command = 'stop';
        subject$.complete();
      }
    },
  };

  const out = {
    /**
     * Starts consuming `source$` and forwarding its events to the observer.
     *
     * Has no effect if the instance is not currently in the `'stopped'` state.
     * Sets `command` to `'start'` and subscribes `startObserver` to `source$`.
     *
     * @returns The RxJS `Subscription` created by subscribing to `source$`,
     *   or `undefined` if the call was a no-op.
     */
    start() {
      if (command !== 'stop') return;
      command = 'start';
      return source$.subscribe(startObserver);
    },

    /**
     * Permanently stops the instance.
     *
     * Sets `command` to `'stop'`, which causes {@link canClear} to return
     * `true` and therefore cancels any pending resume timers. Has no effect
     * if the instance is already stopped.
     */
    stop() {
      if (command === 'stop') return;
      command = 'stop';
    },

    /**
     * Suspends event dispatching while continuing to buffer incoming events.
     *
     * Records the current timestamp as `lastPaused` (only on the first pause)
     * so that resume can compute correct replay delays. Has no effect if the
     * instance is already paused or stopped.
     */
    pause() {
      if (canClear()) return;
      command = 'pause';

      if (!hasBeenPaused) {
        lastPaused = Date.now();
        hasBeenPaused = true;
      }
    },

    /**
     * Replays all buffered events and then resumes live forwarding.
     *
     * Each buffered event is scheduled via `setTimeout` using its original
     * timestamp relative to `lastPaused`, preserving the source's timing.
     * The timers are guarded by {@link canClear}: if the instance is paused
     * or stopped again before a timer fires, that timer is cancelled.
     *
     * Has no effect if the instance is already running (`'start'` or
     * `'resume'`).
     */
    resume() {
      const __check = command === 'resume' || command === 'start';
      if (__check) return;
      command = 'resume';

      for (const { delay, value, isError, isComplete } of events) {
        /** Milliseconds between the pause moment and when this event arrived. */
        const timeout = delay - lastPaused;

        const timer = setTimeout(() => {
          perform(timer, () => {
            if (isError) return RESUME_ACTIONS.error(value);
            if (isComplete) return RESUME_ACTIONS.complete();
            return RESUME_ACTIONS.next(value);
          });
        }, timeout);
      }
    },

    /**
     * Dispatches a lifecycle command by name.
     *
     * Equivalent to calling the corresponding method directly. Useful when
     * the command is determined dynamically.
     *
     * @param action - The {@link Command} to execute.
     * @returns The return value of the corresponding method call.
     */
    command(action: Command) {
      return this[action]();
    },

    /**
     * The current observable state of the instance, derived from `command`.
     *
     * - `'stopped'` when `command` is `'stop'`.
     * - `'running'` when `command` is `'start'` or `'resume'`.
     * - `'paused'`  when `command` is `'pause'`.
     */
    get state() {
      return command === 'stop'
        ? 'stopped'
        : command === 'start' || command === 'resume'
          ? 'running'
          : 'paused';
    },
  };

  return out;
};

export * from './types';
