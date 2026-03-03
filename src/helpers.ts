export const perform = (
  timer: ReturnType<typeof setTimeout>,
  canClear: () => boolean,
  action: () => void,
) => {
  if (canClear()) return clearTimeout(timer);
  action();
};
