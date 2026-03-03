/**
 * Conditionally executes an action or clears a pending timer.
 *
 * If `canClear` returns `true`, the scheduled timer is cancelled via
 * `clearTimeout` and the action is skipped. This is the primary guard used
 * during a pause or stop to prevent buffered events from being dispatched.
 *
 * @param timer - The handle returned by `setTimeout` that may need to be cancelled.
 * @param canClear - A predicate that returns `true` when the timer should be
 *   cleared (e.g. the pausable is currently paused or stopped).
 * @param action - The callback to invoke when the timer should **not** be cleared.
 */
export const perform = (
  timer: ReturnType<typeof setTimeout>,
  canClear: () => boolean,
  action: () => void,
) => {
  if (canClear()) return clearTimeout(timer);
  action();
};
