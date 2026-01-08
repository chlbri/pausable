import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, interval } from 'rxjs';
import { take } from 'rxjs/operators';
import createPausable from './index';
import type { Observer } from 'rxjs';

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

  describe('Initial state', () => {
    it('should not emit values initially (stopped state)', () => {
      createPausable(source$, mockObserver);

      source$.next(1);
      source$.next(2);

      expect(mockObserver.next).not.toHaveBeenCalled();
    });
  });

  describe('start()', () => {
    it('should start emitting values after calling start()', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 2);
    });

    it('should ignore start() when already running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.start(); // Should be ignored
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop()', () => {
    it('should stop emitting values after calling stop()', () => {
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

    it('should stop from paused state', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('should allow restart after stop', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.stop();
      source$.next(2);
      pausable.start();
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
    });
  });

  describe('pause()', () => {
    it('should pause emitting values when running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      source$.next(2);
      source$.next(3);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('should ignore pause when not running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.pause(); // Should be ignored (stopped state)
      pausable.start();
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('should ignore multiple pause calls', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      pausable.pause();
      pausable.pause(); // Should be ignored
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume()', () => {
    it('should resume emitting values after pause', () => {
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

    it('should ignore resume when not paused', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.resume(); // Should be ignored (stopped state)
      source$.next(1);

      expect(mockObserver.next).not.toHaveBeenCalled();
    });

    it('should ignore resume when running', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      pausable.resume(); // Should be ignored (already running)
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });
  });

  describe('command()', () => {
    it('should start with command("start")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);

      expect(mockObserver.next).toHaveBeenCalledWith(1);
    });

    it('should stop with command("stop")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('stop');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('should pause with command("pause")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('pause');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(1);
    });

    it('should resume with command("resume")', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.command('start');
      source$.next(1);
      pausable.command('pause');
      pausable.command('resume');
      source$.next(2);

      expect(mockObserver.next).toHaveBeenCalledTimes(2);
    });
  });

  describe('Observer types', () => {
    it('should work with function observer', () => {
      const nextFn = vi.fn();
      const pausable = createPausable(source$, nextFn);

      pausable.start();
      source$.next(1);

      expect(nextFn).toHaveBeenCalledWith(1);
    });

    it('should work with partial observer (only next)', () => {
      const nextFn = vi.fn();
      const pausable = createPausable(source$, { next: nextFn });

      pausable.start();
      source$.next(1);

      expect(nextFn).toHaveBeenCalledWith(1);
    });

    it('should work with full observer', () => {
      const pausable = createPausable(source$, mockObserver);

      pausable.start();
      source$.next(1);
      source$.complete();

      expect(mockObserver.next).toHaveBeenCalledWith(1);
      expect(mockObserver.complete).toHaveBeenCalled();
    });

    it('should work without observer', () => {
      expect(() => {
        const pausable = createPausable(source$);
        pausable.start();
        source$.next(1);
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should propagate errors to observer', () => {
      const pausable = createPausable(source$, mockObserver);
      const error = new Error('Test error');

      pausable.start();
      source$.error(error);

      expect(mockObserver.error).toHaveBeenCalledWith(error);
    });
  });

  describe('Complex state transitions', () => {
    it('should handle start -> pause -> resume -> stop -> start', () => {
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

      expect(mockObserver.next).toHaveBeenCalledTimes(3);
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
      expect(mockObserver.next).toHaveBeenNthCalledWith(3, 5);
    });
  });

  describe('Integration with RxJS operators', () => {
    it('should work with interval observable', async () => {
      const values: number[] = [];
      const pausable = createPausable(interval(10).pipe(take(5)), value =>
        values.push(value),
      );

      pausable.start();
      await new Promise(resolve => setTimeout(resolve, 25));
      pausable.pause();
      expect(values).toEqual([0, 1]);
      await new Promise(resolve => setTimeout(resolve, 25));
      pausable.resume();
      expect(values).toEqual([0, 1]);
      await new Promise(resolve => setTimeout(resolve, 50));
      console.warn(values);
      expect(values).toEqual([0, 1, 0, 1, 2, 3]);
    });
  });
});
