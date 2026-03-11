import { interval, map, take } from 'rxjs';
import { createPausable, Pausable } from './index';
import { usePrepare } from './fixtures';

vi.useFakeTimers();

describe('createPausable', () => {
  // #01 => Initial state had only one test → unwrapped
  describe('#01 => should not emit values initially (stopped state)', () => {
    const { source$, mockObserver } = usePrepare();
    it('#01 => emit value 1', () => source$.next(1));
    it('#02 => emit value 2', () => source$.next(2));

    it('#03 => next should not have been called', () => {
      return expect(mockObserver.next).not.toHaveBeenCalled();
    });
  });

  describe('#02 => start()', () => {
    describe('#01 => should start emitting values after calling start()', () => {
      const { source$, mockObserver, pausable } = usePrepare();

      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => emit value 2', () => source$.next(2));

      it('#04 => next called 2 times', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(2);
      });

      it('#05 => 1st call with 1', () => {
        expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      });

      it('#06 => 2nd call with 2', () => {
        expect(mockObserver.next).toHaveBeenNthCalledWith(2, 2);
      });
    });

    describe('#02 => should ignore start() when already running', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => start again (ignored)', pausable.start);
      it('#04 => emit value 2', () => source$.next(2));

      it('#05 => next called 2 times', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('#03 => stop()', () => {
    describe('#01 => should stop emitting values after calling stop()', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => stop', pausable.stop);
      it('#04 => stop again (ignored)', pausable.stop);
      it('#05 => emit value 2 (ignored)', () => source$.next(2));
      it('#06 => emit value 3 (ignored)', () => source$.next(3));

      it('#07 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });

      it('#08 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });

    describe('#02 => should stop from paused state', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => pause', pausable.pause);
      it('#04 => emit value 2 (ignored)', () => source$.next(2));

      it('#05 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#04 => pause()', () => {
    describe('#01 => should pause emitting values when running', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => pause', pausable.pause);
      it('#04 => emit value 2 (ignored)', () => source$.next(2));
      it('#05 => emit value 3 (ignored)', () => source$.next(3));

      it('#06 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });

      it('#07 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });

    describe('#02 => should ignore pause when not running', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => pause (ignored, stopped state)', pausable.pause);
      it('#02 => start', pausable.start);
      it('#03 => emit value 1', () => source$.next(1));

      it('#04 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });

    describe('#03 => should ignore multiple pause calls', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => pause', pausable.pause);
      it('#04 => pause again (ignored)', pausable.pause);
      it('#05 => emit value 2 (ignored)', () => source$.next(2));

      it('#06 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#05 => resume()', () => {
    describe('#01 => should resume emitting values after pause', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => pause', pausable.pause);
      it('#04 => emit value 2 (ignored)', () => source$.next(2));
      it('#05 => resume', pausable.resume);
      it('#06 => emit value 3', () => source$.next(3));

      it('#07 => next called 2 times', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(2);
      });

      it('#08 => 1st call with 1', () => {
        expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
      });

      it('#09 => 2nd call with 3', () => {
        expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
      });
    });

    describe('#02 => should ignore resume when not paused', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => resume (ignored, stopped state)', pausable.resume);
      it('#02 => emit value 1 (ignored)', () => source$.next(1));

      it('#03 => next not called', () => {
        expect(mockObserver.next).not.toHaveBeenCalled();
      });
    });

    describe('#03 => should ignore resume when running', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => start', pausable.start);
      it('#02 => resume (ignored, already running)', pausable.resume);
      it('#03 => emit value 1', () => source$.next(1));

      it('#04 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('#06 => command()', () => {
    describe('#01 => should start with command("start")', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => command start', () => pausable.command('start'));
      it('#02 => emit value 1', () => source$.next(1));

      it('#03 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });

    describe('#02 => should stop with command("stop")', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => command start', () => pausable.command('start'));
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => command stop', () => pausable.command('stop'));
      it('#04 => emit value 2 (ignored)', () => source$.next(2));

      it('#05 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });
    });

    describe('#03 => should pause with command("pause")', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => command start', () => pausable.command('start'));
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => command pause', () => pausable.command('pause'));
      it('#04 => emit value 2 (ignored)', () => source$.next(2));

      it('#05 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });
    });

    describe('#04 => should resume with command("resume")', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      it('#01 => command start', () => pausable.command('start'));
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => command pause', () => pausable.command('pause'));
      it('#04 => command resume', () => pausable.command('resume'));
      it('#05 => emit value 2', () => source$.next(2));

      it('#06 => next called 2 times', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('#07 => Observer types', () => {
    describe('#01 => should work with function observer', () => {
      const { source$ } = usePrepare();
      const nextFn = vi.fn();
      const pausable = createPausable(source$, nextFn);
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));

      it('#03 => nextFn called with 1', () => {
        expect(nextFn).toHaveBeenCalledWith(1);
      });
    });

    describe('#02 => should work without observer', () => {
      const { source$ } = usePrepare();

      it('#01 => should not throw', () => {
        expect(() => {
          const pausable = createPausable(source$);
          pausable.start();
          source$.next(1);
        }).not.toThrow();
      });
    });
  });

  // #08 => Error handling had only one test → unwrapped
  describe('#08 => should propagate errors to observer', () => {
    const { source$, mockObserver, pausable } = usePrepare();
    const error = new Error('Test error');
    it('#01 => start', pausable.start);

    it('#02 => emit error', () => {
      source$.error(error);
    });

    it('#03 => error called with error', () => {
      expect(mockObserver.error).toHaveBeenCalledWith(error);
    });
  });

  // #09 => Complex state transitions had only one test → unwrapped
  describe('#09 => should handle start -> pause -> resume -> stop, not -> start', () => {
    const { source$, mockObserver, pausable } = usePrepare();

    it('#01 => start', pausable.start);
    it('#02 => emit value 1', () => source$.next(1));
    it('#03 => pause', pausable.pause);
    it('#04 => emit value 2 (ignored)', () => source$.next(2));
    it('#05 => resume', pausable.resume);
    it('#06 => emit value 3', () => source$.next(3));
    it('#07 => stop', pausable.stop);
    it('#08 => emit value 4 (ignored)', () => source$.next(4));
    it('#09 => start again', pausable.start);
    it('#10 => emit value 5', () => source$.next(5));

    it('#11 => next called 4 times', () => {
      expect(mockObserver.next).toHaveBeenCalledTimes(2);
    });

    it('#12 => 1st call with 1', () => {
      expect(mockObserver.next).toHaveBeenNthCalledWith(1, 1);
    });

    it('#13 => 2nd call with 3', () => {
      expect(mockObserver.next).toHaveBeenNthCalledWith(2, 3);
    });

    it('#14 => 3rd call with 5', () => {
      expect(mockObserver.next).not.toHaveBeenNthCalledWith(3, 5);
    });
  });

  // #10 => Integration with RxJS operators had only one test → unwrapped
  describe('#10 => should work with interval observable', () => {
    const values: number[] = [];
    let pausable: Pausable;

    it('#01 => create and start', () => {
      pausable = createPausable(interval(10).pipe(take(5)), value =>
        values.push(value),
      );
      pausable.start();
    });

    it('#02 => advance 25ms', async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    it('#03 => pause', () => pausable.pause());

    it('#04 => values should be [0, 1]', () => {
      expect(values).toEqual([0, 1]);
    });

    it('#05 => advance 25ms', async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    it('#06 => resume', () => pausable.resume());

    it('#07 => values still [0, 1]', () => {
      expect(values).toEqual([0, 1]);
    });

    it('#08 => advance 500ms', async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    it('#09 => values should be [0, 1, 2, 3, 4]', () => {
      expect(values).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('#11 => Edge cases', () => {
    describe('#01 => real case scenario #1', () => {
      const WAITER = 1000;
      const values: number[] = [];
      let pausable: Pausable;

      it('#01 => create and start', () => {
        pausable = createPausable(
          interval(WAITER).pipe(
            take(5),
            map(v => v + 1),
            map(v => v * 5),
          ),
          { next: value => values.push(value), complete: () => {} },
        );
        pausable.start();
      });

      it('#02 => values should be empty', () => {
        expect(values).toEqual([]);
      });

      it('#03 => advance 2.3s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER * 2.3);
      });

      it('#04 => values should be [5, 10]', () => {
        expect(values).toStrictEqual([5, 10]);
      });

      it('#05 => pause', () => pausable.pause());

      it('#06 => values still [5, 10]', () => {
        expect(values).toStrictEqual([5, 10]);
      });

      it('#07 => advance 1000s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER * 1000);
      });

      it('#08 => values still [5, 10]', () => {
        expect(values).toStrictEqual([5, 10]);
      });

      it('#09 => resume', () => pausable.resume());

      it('#10 => advance 1s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER);
      });

      it('#11 => values should be [5, 10, 15]', () => {
        expect(values).toStrictEqual([5, 10, 15]);
      });

      it('#12 => advance 1s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER);
      });

      it('#13 => values should be [5, 10, 15, 20]', () => {
        expect(values).toStrictEqual([5, 10, 15, 20]);
      });

      it('#14 => advance 1s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER);
      });

      it('#15 => values should be [5, 10, 15, 20, 25]', () => {
        expect(values).toStrictEqual([5, 10, 15, 20, 25]);
      });
    });

    describe('#02 => real case scenario #2', () => {
      const WAITER = 1000;
      const values: number[] = [];
      let pausable: Pausable;

      it('#01 => create and start', () => {
        pausable = createPausable(
          interval(WAITER).pipe(
            take(5),
            map(v => v + 1),
            map(v => v * 5),
          ),
          { next: value => values.push(value), complete: () => {} },
        );
        pausable.start();
      });

      it('#02 => advance 6s', async () => {
        await vi.advanceTimersByTimeAsync(WAITER * 6);
      });

      it('#03 => values should be [5, 10, 15, 20, 25]', () => {
        expect(values).toStrictEqual([5, 10, 15, 20, 25]);
      });
    });

    describe('#03 => should propagate error that arrived during pause on resume', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      const error = new Error('Delayed error');

      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));
      it('#03 => pause', pausable.pause);

      it('#04 => emit error (buffered during pause)', () => {
        source$.error(error);
      });

      it('#05 => resume', pausable.resume);

      it('#06 => advance 100ms', async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      it('#07 => error called with error', () => {
        expect(mockObserver.error).toHaveBeenCalledWith(error);
      });

      it('#08 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });

      it('#09 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });
    });

    describe('#04 => should not emit buffered values if paused again before setTimeout fires', () => {
      const WAITER = 1000;
      const values: number[] = [];
      let pausable: Pausable;

      it('#01 => create pausable, state is stopped', () => {
        pausable = createPausable(interval(WAITER).pipe(take(5)), value =>
          values.push(value),
        );
        expect(pausable.state).toBe('stopped');
      });

      it('#02 => start', () => pausable.start());

      it('#03 => state is running', () => {
        expect(pausable.state).toBe('running');
      });

      it('#04 => values should be empty', () => {
        expect(values).toEqual([]);
      });

      it('#05 => advance 2.5s', () => {
        vi.advanceTimersByTime(WAITER * 2.5);
      });

      it('#06 => values should be [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#07 => pause', () => pausable.pause());

      it('#08 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#09 => state is paused', () => {
        expect(pausable.state).toBe('paused');
      });

      it('#10 => advance 1000s', () => {
        vi.advanceTimersByTime(WAITER * 1000);
      });

      it('#11 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#12 => resume', () => pausable.resume());

      it('#13 => advance 0.2s', () => {
        vi.advanceTimersByTime(WAITER * 0.2);
      });

      it('#14 => state is running', () => {
        expect(pausable.state).toBe('running');
      });

      it('#15 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#16 => pause again', () => pausable.pause());

      it('#17 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#18 => advance 5s', () => {
        vi.advanceTimersByTime(WAITER * 5);
      });

      it('#19 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#20 => advance 1000s', () => {
        vi.advanceTimersByTime(WAITER * 1000);
      });

      it('#21 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#22 => resume', () => pausable.resume());

      it('#23 => values still [0, 1]', () => {
        expect(values).toEqual([0, 1]);
      });

      it('#24 => advance 1s', () => {
        vi.advanceTimersByTime(WAITER);
      });

      it('#25 => values should be [0, 1, 2]', () => {
        expect(values).toEqual([0, 1, 2]);
      });

      it('#26 => advance 1s', () => {
        vi.advanceTimersByTime(WAITER);
      });

      it('#27 => values should be [0, 1, 2, 3]', () => {
        expect(values).toEqual([0, 1, 2, 3]);
      });

      it('#28 => advance 1s', () => {
        vi.advanceTimersByTime(WAITER);
      });

      it('#29 => values should be [0, 1, 2, 3, 4]', () => {
        expect(values).toEqual([0, 1, 2, 3, 4]);
      });

      it('#30 => advance 1s', () => {
        vi.advanceTimersByTime(WAITER);
      });

      it('#31 => values still [0, 1, 2, 3, 4]', () => {
        expect(values).toEqual([0, 1, 2, 3, 4]);
      });

      it('#32 => advance 1000s', () => {
        vi.advanceTimersByTime(WAITER * 1000);
      });

      it('#33 => values still [0, 1, 2, 3, 4]', () => {
        expect(values).toEqual([0, 1, 2, 3, 4]);
      });

      it('#34 => resume again (ignored, already stopped)', () =>
        pausable.resume());

      it('#35 => values still [0, 1, 2, 3, 4]', () => {
        expect(values).toEqual([0, 1, 2, 3, 4]);
      });

      it('#36 => advance 1000s', () => {
        vi.advanceTimersByTime(WAITER * 1000);
      });

      it('#37 => values still [0, 1, 2, 3, 4]', () => {
        expect(values).toEqual([0, 1, 2, 3, 4]);
      });
    });

    describe('#06 => should emit buffered error after resume when error arrived during pause', () => {
      const { source$, mockObserver, pausable } = usePrepare();
      const error = new Error('Buffered error');
      it('#01 => start', pausable.start);
      it('#02 => emit value 1', () => source$.next(1));

      it('#03 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });

      it('#04 => next called with 1', () => {
        expect(mockObserver.next).toHaveBeenCalledWith(1);
      });

      it('#05 => pause', pausable.pause);

      it('#06 => state is paused', () => {
        expect(pausable.state).toBe('paused');
      });

      it('#07 => emit error (buffered during pause)', () => {
        source$.error(error);
      });

      it('#08 => error not called yet', () => {
        expect(mockObserver.error).not.toHaveBeenCalled();
      });

      it('#09 => resume', pausable.resume);

      it('#10 => state is running', () => {
        expect(pausable.state).toBe('running');
      });

      it('#11 => pause again', pausable.pause);

      it('#12 => error still not called', () => {
        expect(mockObserver.error).not.toHaveBeenCalled();
      });

      it('#13 => advance 100ms', async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      it('#14 => resume', pausable.resume);

      it('#15 => advance 100ms', async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      it('#16 => error called 1 time', () => {
        expect(mockObserver.error).toHaveBeenCalledTimes(1);
      });

      it('#17 => error called with error', () => {
        expect(mockObserver.error).toHaveBeenCalledWith(error);
      });

      it('#18 => next called 1 time', () => {
        expect(mockObserver.next).toHaveBeenCalledTimes(1);
      });

      it('#19 => complete not called', () => {
        expect(mockObserver.complete).not.toHaveBeenCalled();
      });
    });
  });
});
