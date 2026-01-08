import type { Observer } from 'rxjs';

export type SubArgs<T> = Partial<Observer<T>> | ((value: T) => void);
export type Command = 'start' | 'stop' | 'pause' | 'resume';
export type State = 'stopped' | 'running' | 'paused';
