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
  const canClear = () => command === 'pause' || command === 'stop';

  // Subscribe to the controlled Observable
  subject$.subscribe(observer);

  const start = () => {
    if (command !== 'stop') return;
    command = 'start';
    source$.subscribe({
      next: value => {
        if (command === 'pause' || command === 'stop') return;
        subject$.next(value);
        array.shift();
      },
      error: value => {
        if (command === 'pause' || command === 'stop') return;
        subject$.error(value);
        array.shift();
      },
      complete: () => {
        if (!hasBeenPaused) {
          command = 'stop';
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
    command = 'pause';
    if (!hasBeenPaused) {
      lastPaused = Date.now();
      hasBeenPaused = true;
    }
  };

  const resume = () => {
    if (command === 'resume' || command === 'start') return;
    command = 'resume';

    for (const { delay, value, isError, isComplete } of array) {
      const timeout = delay - lastPaused;
      if (isError) {
        const timer = setTimeout(() => {
          if (canClear()) {
            return clearTimeout(timer);
          }
          subject$.error(value);
          return subject$.complete();
        }, timeout);
      }

      if (isComplete) {
        const timer = setTimeout(() => {
          if (canClear()) {
            return clearTimeout(timer);
          }
          subject$.complete();
          command = 'stop';
        }, timeout);
      }

      const timer = setTimeout(() => {
        if (canClear()) {
          return clearTimeout(timer);
        }
        subject$.next(value);
        array.shift();
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
    get state() {
      return command === 'stop'
        ? 'stopped'
        : command === 'start' || command === 'resume'
          ? 'running'
          : 'paused';
    },
  };
};

export * from './types';
