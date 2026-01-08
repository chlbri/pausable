import type { Observable, Subscription } from 'rxjs';
import type { Command, State, SubArgs } from './types';

const createPausable = <T>(
  source$: Observable<T>,
  observer?: SubArgs<T>,
) => {
  let state: State = 'stopped';
  let sourceSubscription: Subscription | null = null;

  const subscribe = () => {
    sourceSubscription = source$.subscribe({
      next: value => {
        if (state === 'running') {
          if (typeof observer === 'function') {
            observer(value);
          } else if (observer?.next) {
            observer.next(value);
          }
        }
      },
      error: err => {
        if (typeof observer === 'object' && observer?.error) {
          observer.error(err);
        }
      },
      complete: () => {
        if (typeof observer === 'object' && observer?.complete) {
          observer.complete();
        }
      },
    });
  };

  const unsubscribe = () => {
    if (sourceSubscription) {
      sourceSubscription.unsubscribe();
      sourceSubscription = null;
    }
  };

  const start = () => {
    if (state !== 'stopped') return;
    state = 'running';
    subscribe();
  };

  const stop = () => {
    if (state === 'stopped') return;
    state = 'stopped';
    unsubscribe();
  };

  const pause = () => {
    if (state !== 'running') return;
    state = 'paused';
    unsubscribe();
  };

  const resume = () => {
    if (state !== 'paused') return;
    state = 'running';
    subscribe();
  };

  const ACTIONS = { start, stop, pause, resume };
  const command = (action: Command) => ACTIONS[action]();

  return {
    start,
    stop,
    pause,
    resume,
    command,
  };
};

export default createPausable;
