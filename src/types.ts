import type { Observer } from 'rxjs';

export type SubArgs<T> = Partial<Observer<T>> | ((value: T) => void);
