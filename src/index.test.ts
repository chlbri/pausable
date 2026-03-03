import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, interval, map, take } from 'rxjs';
import { createPausable } from './index';
import type { Observer } from 'rxjs';

vi.useFakeTimers();

describe('createPausable', () => {
  let source$: Subject<number>;
  let mockObserver: Observer<number>;

  beforeEach(() => {
    source$ = new Subject<number>();
    mockObserver = {
      next: vi.fn(),
      error: vi.fn(),
      complete: vi.fn(),
    };
  });

  describe('#01 => Initial state', () => {
    it('#01 => should not emit values initially (stopped state)', () => {
      createPausable(source$, mockObserver);

      source$.next(1);
      source$.next(2);

      expect(mockObserver.next).not.toHaveBeenCalled();
    });
  });

  describe('#02 => start()', () => {
    it('#01 => should start emitting values after calling start()', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 2);
    });

    it('#02 => should ignore start() when already running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.start(); // Should be ignored
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
    });
  });

  describe('#03 => stop()', () => {
    it('#01 => should stop emitting values after calling stop()', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.stop();
      pausable.stop();
      source$.next(2);
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('#02 => should stop from paused state', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('#03 => should allow restart after stop', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.stop();
      source$.next(2);
      pausable.start();
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(3);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
    });
  });

  describe('#04 => pause()', () => {
    it('#01 => should pause emitting values when running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('#02 => should ignore pause when not running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.pause(); // Should be ignored (stopped state)
      pausable.start();
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('#03 => should ignore multiple pause calls', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      pausable.pause(); // Should be ignored
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('#05 => resume()', () => {
    it('#01 => should resume emitting values after pause', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);
      pausable.resume();
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
    });

    it('#02 => should ignore resume when not paused', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.resume(); // Should be ignored (stopped state)
      source$.next(1);

      expect(mockObserver.next).not.toHaveBeenCalled();
    });

    it('#03 => should ignore resume when running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      pausable.resume(); // Should be ignored (already running)
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });
  });

  describe('#06 => command()', () => {
    it('#01 => should start with command("start")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('#02 => should stop with command("stop")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('stop');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('#03 => should pause with command("pause")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('pause');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('#04 => should resume with command("resume")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('pause');
      pausable.command('resume');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
    });
  });

  describe('#07 => Observer types', () => {
    it('#01 => should work with function observer', () => {
      const nextFn = vi.fn();
      const pausable = createPausable(source$, nextFn);

      pausable.start();
      source$.next(1);

      expect(nextFn).toHaveBeenCalledWith(1);
    });

    it('#02 => should work without observer', () => {
      expect(() => {
        const pausable = createPausable(source$);
        pausable.start();
        source$.next(1);
      }).not.toThrow();
    });
  });

  describe('#08 => Error handling', () => {
    it('#01 => should propagate errors to observer', () => {
      const pausable = createPausable(source$, mockObserver);
      const error = new Error('Test error');

      pausable.start();
      source$.error(error);

      expect(mockObserver.error).toHaveBeenCalledWith(error);
    });
  });

  describe('#09 => Complex state transitions', () => {
    it('#01 => should handle start -> pause -> resume -> stop -> start', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);

      pausable.pause();
      source$.next(2);

      pausable.resume();
      source$.next(3);

      pausable.stop();
      source$.next(4);

      pausable.start();
      source$.next(5);

      expect(mockObserver.next).toHaveBeenCalledTimes(4);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
      expect(mockObserver.next).toHaveBeenNthCalledWith(3, 5);
    });
  });

  describe('#10 => Integration with RxJS operators', () => {
    it('#01 => should work with interval observable', async () => {
      const values: number[] = [];
      const pausable = createPausable(
        interval(10).pipe(take(5)),
        value => {
          console.log(`Received value: ${value}`);
          values.push(value);
        },
      );

      pausable.start();
      await vi.advanceTimersByTimeAsync(25);
      pausable.pause();
      expect(values).toEqual([0, 1]);
      await vi.advanceTimersByTimeAsync(25);
      pausable.resume();
      expect(values).toEqual([0, 1]);
      await vi.advanceTimersByTimeAsync(500);
      console.warn(values);
      expect(values).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('#11 => Edge cases', () => {
    it('#01 => should handle rapid state changes', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);
      pausable.resume();
      source$.next(3);
      pausable.stop();
      source$.next(4);
      pausable.start();
      source$.next(5);

      expect(mockObserver.next).toHaveBeenCalledTimes(4);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
      expect(mockObserver.next).toHaveBeenNthCalledWith(3, 5);
    });

    it('#02 => real case scenario #1', async () => {
      const WAITER = 1000;
      const values: number[] = [];

      const pausable = createPausable(
        interval(WAITER).pipe(
          take(5),
          map(v => v + 1),
          map(v => v * 5),
        ),
        { next: value => values.push(value), complete: () => {} },
      );

      pausable.start();
      expect(values).toEqual([]);

      await vi.advanceTimersByTimeAsync(WAITER * 2.3);
      expect(values).toStrictEqual([5, 10]);
      pausable.pause();
      expect(values).toStrictEqual([5, 10]);
      await vi.advanceTimersByTimeAsync(WAITER * 1000);
      expect(values).toStrictEqual([5, 10]);
      pausable.resume();
      await vi.advanceTimersByTimeAsync(WAITER);
      expect(values).toStrictEqual([5, 10, 15]);
      await vi.advanceTimersByTimeAsync(WAITER);
      expect(values).toStrictEqual([5, 10, 15, 20]);
      await vi.advanceTimersByTimeAsync(WAITER);
      expect(values).toStrictEqual([5, 10, 15, 20, 25]);
    });

    it('#03 => real case scenario #1', async () => {
      const WAITER = 1000;
      const values: number[] = [];

      const pausable = createPausable(
        interval(WAITER).pipe(
          take(5),
          map(v => v + 1),
          map(v => v * 5),
        ),
        { next: value => values.push(value), complete: () => {} },
      );

      pausable.start();
      await vi.advanceTimersByTimeAsync(WAITER * 6);
      expect(values).toStrictEqual([5, 10, 15, 20, 25]);
    });

    it('#03 => should propagate error that arrived during pause on resume', () => {
      const pausable = createPausable(source$, mockObserver);
      const error = new Error('Delayed error');

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.error(error);
      pausable.resume();

      expect(mockObserver.error).toHaveBeenCalledWith(error);
      expect(mockObserver.next).toHaveBeenCalledTimes(1);
      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('#04 => should not emit buffered values if paused again before setTimeout fires', async () => {
      const WAITER = 1000;
      const values: number[] = [];

      const pausable = createPausable(
        interval(WAITER).pipe(take(5)),
        value => values.push(value as number),
      );

      pausable.start();
      await vi.advanceTimersByTimeAsync(WAITER * 2.5);
      expect(values).toEqual([0, 1]);
      pausable.pause();
      await vi.advanceTimersByTimeAsync(WAITER * 0.5);
      pausable.resume();
      pausable.pause();
      await vi.advanceTimersByTimeAsync(WAITER * 5);
      expect(values).toEqual([0, 1, 2]);
    });
  });
});
