import type { Observable, Observer } from 'rxjs';

export type SubArgs<T> = Partial<Observer<T>> | ((value: T) => void);
export type Command = 'start' | 'stop' | 'pause' | 'resume';
export type State = 'stopped' | 'running' | 'paused';

export type Pausable = {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  command: (action: 'start' | 'stop' | 'pause' | 'resume') => void;
};

export type CreatePausable_F = <T>(
  source$: Observable<T>,
  observer?: SubArgs<T>,
) => Pausable;
