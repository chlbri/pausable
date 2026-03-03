import { Subject } from 'rxjs/internal/Subject';
import type { Command, CreatePausable_F, Delayed } from './types';
import { perform as _perform } from './helpers';
import { Observer } from 'rxjs';

export const createPausable: CreatePausable_F = (source$, observer) => {
  let lastPaused = Date.now();
  const events: Delayed[] = [];

  source$.subscribe({
    next: value => {
      events.push({
        delay: Date.now(),
        value,
        isError: false,
      });
    },
    error: value => {
      events.push({
        delay: Date.now(),
        value,
        isError: true,
      });
    },
    complete: () => {
      events.push({
        delay: Date.now(),
        value: undefined,
        isError: false,
        isComplete: true,
      });
    },
  });

  let command: Command = 'stop';
  const subject$ = new Subject<any>();
  subject$.subscribe(observer);
  let hasBeenPaused = false;
  const canClear = () => command === 'pause' || command === 'stop';

  const perform = (
    timer: ReturnType<typeof setTimeout>,
    action: () => void,
  ) => {
    return _perform(timer, canClear, () => {
      action();
      return events.shift();
    });
  };

  const RESUME_ACTIONS = {
    next: (value: any) => subject$.next(value),
    error: (value: any) => {
      subject$.error(value);
      return subject$.complete();
    },
    complete: () => {
      subject$.complete();
      command = 'stop';
    },
  };

  const startObserver: Observer<any> = {
    next: value => {
      if (canClear()) return;
      subject$.next(value);
      events.shift();
    },
    error: value => {
      if (canClear()) return;
      subject$.error(value);
      events.shift();
    },
    complete: () => {
      if (!hasBeenPaused) {
        command = 'stop';
        subject$.complete();
      }
    },
  };

  const out = {
    start() {
      if (command !== 'stop') return;
      command = 'start';
      return source$.subscribe(startObserver);
    },

    stop() {
      if (command === 'stop') return;
      command = 'stop';
    },

    pause() {
      if (canClear()) return;
      command = 'pause';

      if (!hasBeenPaused) {
        lastPaused = Date.now();
        hasBeenPaused = true;
      }
    },

    resume() {
      const __check = command === 'resume' || command === 'start';
      if (__check) return;
      command = 'resume';

      for (const { delay, value, isError, isComplete } of events) {
        const timeout = delay - lastPaused;

        const timer = setTimeout(() => {
          perform(timer, () => {
            if (isError) return RESUME_ACTIONS.error(value);
            if (isComplete) return RESUME_ACTIONS.complete();
            return RESUME_ACTIONS.next(value);
          });
        }, timeout);
      }
    },

    command(action: Command) {
      return this[action]();
    },

    get state() {
      return command === 'stop'
        ? 'stopped'
        : command === 'start' || command === 'resume'
          ? 'running'
          : 'paused';
    },
  };

  return out;
};

export * from './types';
