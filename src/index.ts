import { Subject } from 'rxjs/internal/Subject';
import type { Command, CreatePausable_F } from './types';

type Delayed<T = any> = {
  delay: number;
  value: T;
  isError: boolean;
  isComplete?: boolean;
};

export const createPausable: CreatePausable_F = (source$, observer) => {
  let lastPaused = Date.now();
  const array: Delayed[] = [];

  source$.subscribe({
    next: value => {
      array.push({
        delay: Date.now(),
        value,
        isError: false,
      });
    },
    error: value => {
      array.push({
        delay: Date.now(),
        value,
        isError: true,
      });
    },
    complete: () => {
      array.push({
        delay: Date.now(),
        value: undefined,
        isError: false,
        isComplete: true,
      });
    },
  });

  let command: Command = 'stop';
  const subject$ = new Subject<any>();
  let hasBeenPaused = false;

  // Subscribe to the controlled Observable
  subject$.subscribe(observer);

  const start = () => {
    if (command !== 'stop') return;
    command = 'start';
    source$.subscribe({
      next: value => {
        if (command === 'pause' || command === 'stop') return;
        subject$.next(value);
      },
      error: value => {
        if (command === 'pause' || command === 'stop') return;
        subject$.error(value);
      },
      complete: () => {
        if (!hasBeenPaused) {
          subject$.complete();
        }
      },
    });
  };

  const stop = () => {
    if (command === 'stop') return;
    command = 'stop';
  };

  const pause = () => {
    if (command === 'pause' || command === 'stop') return;
    lastPaused = Date.now();
    command = 'pause';
    hasBeenPaused = true;
  };

  const resume = () => {
    command = 'resume';
    const filtered = array.filter(({ delay }) => delay >= lastPaused);

    for (const { delay, value, isError, isComplete } of filtered) {
      if (isError) {
        subject$.error(value);
        return subject$.complete();
      }

      const timeout = delay - lastPaused;
      if (isComplete) {
        setTimeout(() => {
          subject$.complete();
          command = 'stop';
        }, timeout);
      }

      const timer = setTimeout(() => {
        subject$.next(value);
        if (command === 'pause' || command === 'stop') {
          return clearTimeout(timer);
        }
      }, timeout);
    }
  };

  return {
    start,
    stop,
    pause,
    resume,
    command: (action: 'start' | 'stop' | 'pause' | 'resume') => {
      if (action === 'start') return start();
      if (action === 'stop') return stop();
      if (action === 'pause') return pause();
      if (action === 'resume') return resume();
    },
  };
};

export * from './types';
