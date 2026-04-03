# @bemedev/rx-pausable

A pausable wrapper for RxJS observables with start, stop, pause, and resume
controls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)

## Features

- 🎛️ **State Management**: Control observable streams with `start`, `stop`,
  `pause`, and `resume`
- 🔁 **Restartable**: Call `start()` again after `stop()` to fully restart
  the stream with a clean slate
- � **Fixed Source**: The source observable is bound at creation time and
  never changes — `createPausable` cannot be replayed with a different
  source
- �🗺️ **State Inspector**: Read the current state (`'stopped'` |
  `'running'` | `'paused'`) via the `state` property
- 🔄 **Command Interface**: Programmatic control via `command()` method
- 🧩 **Smart Buffering**: Values emitted during pause are buffered and
  re-emitted after `resume()` with correct relative timing
- 📦 **Flexible Observers**: Support for function, partial, full, or no
  observer
- 🔗 **Dynamic Subscribe**: Add extra observers at any time via
  `subscribe()` — returns an RxJS `Subscription` for granular control
- 🔌 **Proper Lifecycle**: Automatic subscription management and cleanup
  per `start()` call
- 💪 **TypeScript**: Full type safety with TypeScript support
- ✅ **Well Tested**: 100% test coverage with comprehensive test suite

## Installation

```bash
npm install @bemedev/rx-pausable
```

```bash
pnpm add @bemedev/rx-pausable
```

```bash
yarn add @bemedev/rx-pausable
```

## Usage

### Basic Example

```typescript
import { interval } from 'rxjs';
import createPausable from '@bemedev/rx-pausable';

// Create a pausable wrapper around an observable
const pausable = createPausable(interval(1000), value =>
  console.log('Value:', value),
);

// Start emitting values
pausable.start();
// Output: Value: 0, Value: 1, Value: 2...

console.log(pausable.state); // 'running'

// Pause the stream (buffers incoming values)
pausable.pause();

console.log(pausable.state); // 'paused'

// Resume the stream (re-emits buffered values with correct timing)
pausable.resume();

// Stop completely
pausable.stop();

console.log(pausable.state); // 'stopped'
```

### With Full Observer

```typescript
import { Subject } from 'rxjs';
import createPausable from '@bemedev/rx-pausable';

const source$ = new Subject<number>();

const pausable = createPausable(source$, {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!'),
});

pausable.start();
source$.next(1); // Output: Next: 1
source$.complete(); // Output: Complete!
```

### Using Command Interface

```typescript
import { of } from 'rxjs';
import createPausable from '@bemedev/rx-pausable';

const pausable = createPausable(of(1, 2, 3), console.log);

// Control via commands
pausable.command('start');
pausable.command('pause');
pausable.command('resume');
pausable.command('stop');
```

### Without Observer (Side Effects Only)

```typescript
import { interval } from 'rxjs';
import { tap } from 'rxjs/operators';
import createPausable from '@bemedev/rx-pausable';

const source$ = interval(1000).pipe(
  tap(value => console.log('Side effect:', value)),
);

const pausable = createPausable(source$);
pausable.start();
```

## API

### `createPausable<T>(source$: Observable<T>, observer?: Observer<T> | ((value: T) => void))`

Creates a pausable wrapper around an RxJS observable.

> **Note:** The `source$` observable is **fixed at creation time** and
> cannot be changed afterwards. If you need to switch to a different
> source, create a new `createPausable` instance. The source is never
> mutated or replaced internally.

**Parameters:**

- `source$`: The source Observable to wrap. Bound permanently to this
  instance — cannot be swapped after creation.
- `observer` (optional): Can be:
  - A function `(value: T) => void`
  - A partial observer `{ next?: ..., error?: ..., complete?: ... }`
  - A full observer `{ next: ..., error: ..., complete: ... }`
  - `undefined` (for observables with side effects only)

**Returns:** An object with control methods:

#### `start(): void`

Starts (or **restarts**) the stream. Only works from the `stopped` state.

Each call fully resets internal state: a fresh internal `Subject` is
created, the event buffer is cleared, and timing references are reset. This
means calling `start()` after `stop()` is safe and produces a clean new
subscription to the source observable.

#### `stop(): void`

Stops the stream. Cancels any pending resume timers and sets the instance
back to the `stopped` state, from which it can be restarted with `start()`.
Can be called from any non-`stopped` state.

#### `pause(): void`

Pauses the stream. Incoming values from the source are buffered. Only works
from `running` state.

#### `resume(): void`

Resumes the stream and re-emits all buffered values (in order, with
relative timing). Only works from `paused` state.

#### `subscribe(observer: ((value: T) => void) | Partial<Observer<T>>): Subscription`

Subscribes an additional observer to the internal subject. Unlike the
observer passed to `createPausable`, this subscriber is registered
dynamically and receives the same forwarded events subject to the same
pause/resume/stop lifecycle controls.

Returns an RxJS `Subscription` that can be used to unsubscribe.

```typescript
import { Subject } from 'rxjs';
import { createPausable } from '@bemedev/rx-pausable';

const source$ = new Subject<number>();
const pausable = createPausable(source$, v => console.log('primary:', v));

const sub = pausable.subscribe(v => console.log('secondary:', v));

pausable.start();
source$.next(1); // primary: 1 / secondary: 1

sub.unsubscribe();
source$.next(2); // primary: 2 (secondary no longer receives)
```

#### `command(action: 'start' | 'stop' | 'pause' | 'resume'): void`

Executes a control action programmatically.

#### `state: 'stopped' | 'running' | 'paused'` (read-only)

Returns the current state of the pausable wrapper.

## State Machine

The pausable wrapper implements a simple state machine:

```
  ┌─────────────────────────────────────────────────┐
  │                    start()                       │
  ▼                                                  │
stopped ──start()──> running ──pause()──> paused     │
            │                                │        │
            │           stop()               │        │
            └──────────────────────────────► │        │
                                             ▼        │
                                           stopped ───┘
                                             ▲
                                             │ stop()
                                           paused ──resume()──> running
```

**States:**

- `stopped`: Initial state (or after `stop()`); not forwarding values.
  Calling `start()` resets all internal state and begins a fresh
  subscription.
- `running`: Actively forwarding values from source to observer
- `paused`: Stream suspended; source values are buffered until `resume()`

**Valid transitions:**

| Current state | Action     | Next state |
| ------------- | ---------- | ---------- |
| `stopped`     | `start()`  | `running`  |
| `running`     | `pause()`  | `paused`   |
| `running`     | `stop()`   | `stopped`  |
| `paused`      | `resume()` | `running`  |
| `paused`      | `stop()`   | `stopped`  |

**Invalid transitions are silently ignored:**

- `start()` when already `running` or `paused`
- `pause()` when `stopped` or already `paused`
- `resume()` when `stopped` or `running`
- `stop()` when already `stopped`

## Behavior Notes

### Restart Semantics

Calling `stop()` followed by `start()` performs a **full restart**: all
internal state (event buffer, timing references, internal subject) is
discarded and recreated fresh. The observer originally passed to
`createPausable` is re-subscribed automatically.

```typescript
import { interval } from 'rxjs';
import { createPausable } from '@bemedev/rx-pausable';

const values: number[] = [];
const pausable = createPausable(interval(1000), v =>
  values.push(v as number),
);

pausable.start();
// ... after some time: values = [0, 1, 2]

pausable.stop();
// values stay as-is; no more emissions

pausable.start(); // fresh restart — buffer and timing reset
// ... after some time: values = [0, 1, 2, 0, 1, 2, ...]
//                                ↑ first run   ↑ second run (restarts from 0)
```

### Pause/Resume Semantics

When you call `pause()`, the wrapper **buffers** all values emitted by the
source. When you call `resume()`, all buffered values are **re-emitted** to
the observer in order, with their original relative timestamps, before
resuming normal forwarding.

This means **no values are lost** during a pause, regardless of whether the
source is hot or cold:

```typescript
const subject$ = new Subject<number>();
const pausable = createPausable(subject$, console.log);
pausable.start();
subject$.next(1); // Output: 1
pausable.pause();
subject$.next(2); // Buffered (no output yet)
subject$.next(3); // Buffered (no output yet)
pausable.resume();
// Output: 2, 3 (buffered values re-emitted)
subject$.next(4); // Output: 4
```

Errors emitted during pause are also buffered and propagated after
`resume()`:

```typescript
const subject$ = new Subject<number>();
const pausable = createPausable(subject$, {
  next: v => console.log('Next:', v),
  error: e => console.error('Error:', e),
});
pausable.start();
subject$.next(1); // Output: Next: 1
pausable.pause();
subject$.error(new Error('oops')); // Buffered
pausable.resume();
// Output: Error: Error: oops (propagated after resume)
```

## TypeScript

Full TypeScript support with generic types:

```typescript
import { Observable } from 'rxjs';
import createPausable from '@bemedev/rx-pausable';

interface MyData {
  id: number;
  value: string;
}

const source$: Observable<MyData> = ...;
const pausable = createPausable(source$, (data: MyData) => {
  console.log(data.id, data.value);
});
```

## Requirements

- Node.js >= 22 (LTS)
- RxJS >= 7.0.0 (peer dependency)

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Lint
pnpm lint
```

## Contributing

Contributions are welcome! Please follow the test numerotation rules
defined in [.github/rules/test.rules.md](.github/rules/test.rules.md) when
adding tests.

## License

MIT

## Author

**chlbri** (bri_lvi@icloud.com)

- [GitHub](https://github.com/chlbri)
- [Website](https://beme-dev.vercel.app)

## Links

- [Repository](https://github.com/chlbri/pausable)
- [RxJS Documentation](.github/docs/rxjs.md)
- [Test Rules](.github/rules/test.rules.md)
- [npm Package](https://www.npmjs.com/package/@bemedev/rx-pausable)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.
