import type { Observer } from 'rxjs';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { createPausable } from './index';

export const usePrepare = () => {
  const source$ = new Subject<number>();

  const mockObserver: Observer<number> = {
    next: vi.fn(),
    error: vi.fn(),
    complete: vi.fn(),
  };

  const pausable = createPausable(source$, mockObserver);

  return {
    source$,
    mockObserver,
    pausable,
  };
};
