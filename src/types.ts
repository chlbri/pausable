import type { Observable, Observer } from 'rxjs';

/**
 * Accepted shapes for a subscriber passed to {@link createPausable}.
 *
 * Either a plain `next` callback **or** a partial {@link Observer} object
 * (any combination of `next`, `error`, and `complete`) is accepted.
 *
 * @template T - The value type emitted by the source observable.
 */
export type SubArgs<T> = Partial<Observer<T>> | ((value: T) => void);

/**
 * The set of commands that can be issued to a {@link Pausable} instance.
 *
 * - `'start'`  – begins consuming the source observable.
 * - `'stop'`   – permanently halts consumption and clears all state.
 * - `'pause'`  – suspends dispatching while buffering incoming events.
 * - `'resume'` – replays buffered events and resumes live dispatching.
 */
export type Command = 'start' | 'stop' | 'pause' | 'resume';

/**
 * The observable runtime state of a {@link Pausable} instance.
 *
 * - `'stopped'` – the instance has not been started, or has been stopped.
 * - `'running'` – actively consuming and forwarding events.
 * - `'paused'`  – consumption is suspended; events are buffered internally.
 */
export type State = 'stopped' | 'running' | 'paused';

/**
 * Public interface of the object returned by {@link createPausable}.
 *
 * Provides fine-grained lifecycle control over an RxJS observable subscription.
 *
 * @example
 * ```ts
 * const pausable = createPausable(source$, observer);
 * pausable.start();
 * pausable.pause();
 * pausable.resume();
 * pausable.stop();
 * ```
 */
export type Pausable = {
  /**
   * Starts consuming the source observable and forwarding events to the
   * observer. Has no effect if the instance is not in the `'stopped'` state.
   */
  start: () => void;

  /**
   * Permanently stops the instance. Any in-flight timers are cancelled and
   * no further events will be forwarded. Has no effect if already stopped.
   */
  stop: () => void;

  /**
   * Suspends event dispatching while continuing to buffer incoming events.
   * Has no effect if the instance is already paused or stopped.
   */
  pause: () => void;

  /**
   * Replays all events that were buffered during the paused period, then
   * resumes live forwarding. Has no effect if the instance is already running.
   */
  resume: () => void;

  /**
   * Dispatches one of the four lifecycle commands by name.
   * Equivalent to calling the corresponding method directly.
   *
   * @param action - The {@link Command} to execute.
   */
  command: (action: Command) => void;

  /**
   * The current observable state of the instance.
   *
   * @see {@link State}
   */
  state: State;
};

/**
 * Factory function signature for {@link createPausable}.
 *
 * Wraps a source observable with pause/resume/stop/start lifecycle controls
 * and pipes its events through to the provided observer.
 *
 * Events emitted while the instance is paused are timestamped and buffered
 * so they can be replayed—with their original relative timing—when
 * {@link Pausable.resume} is called.
 *
 * @template T - The value type emitted by the source observable.
 *
 * @param source$ - The RxJS observable to wrap.
 * @param observer - Optional subscriber that receives forwarded events.
 *   Accepts either a plain `next` callback or a partial {@link Observer}.
 *
 * @returns A {@link Pausable} instance that controls the subscription lifecycle.
 */
export type CreatePausable_F = <T>(
  source$: Observable<T>,
  observer?: SubArgs<T>,
) => Pausable;

/**
 * An event captured from the source observable while the instance is running.
 *
 * Each entry records the absolute timestamp at which the event arrived,
 * its payload, and flags that indicate whether it represents an error or a
 * completion signal. Buffered entries are replayed on {@link Pausable.resume}.
 *
 * @template T - The type of the event's value payload.
 */
export type Delayed<T = any> = {
  /**
   * Absolute timestamp (milliseconds since epoch via `Date.now()`) at which
   * the event was received from the source observable.
   */
  delay: number;

  /**
   * The payload of the event.
   * For completion events this will be `undefined`.
   */
  value: T;

  /**
   * `true` when this entry represents an error notification;
   * `false` for regular `next` or `complete` events.
   */
  isError: boolean;

  /**
   * `true` when this entry represents the source observable's `complete`
   * notification. Omitted (or `false`) for `next` and `error` events.
   */
  isComplete?: boolean;
};
