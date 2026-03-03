# @bemedev/rx-pausable

A pausable wrapper for RxJS observables with start, stop, pause, and resume
controls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)

## Features

- 🎛️ **State Management**: Control observable streams with `start`, `stop`,
  `pause`, and `resume`
- �️ **State Inspector**: Read the current state (`'stopped'` | `'running'`
  | `'paused'`) via the `state` property
- 🔄 **Command Interface**: Programmatic control via `command()` method
- 🧩 **Smart Buffering**: Values emitted during pause are buffered and
  re-emitted after `resume()` with correct relative timing
- 📦 **Flexible Observers**: Support for function, partial, full, or no
  observer
- 🔌 **Proper Lifecycle**: Automatic subscription management and cleanup
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

**Parameters:**

- `source$`: The source Observable to wrap
- `observer` (optional): Can be:
  - A function `(value: T) => void`
  - A partial observer `{ next?: ..., error?: ..., complete?: ... }`
  - A full observer `{ next: ..., error: ..., complete: ... }`
  - `undefined` (for observables with side effects only)

**Returns:** An object with control methods:

#### `start(): void`

Starts emitting values from the observable. Only works from `stopped`
state.

#### `stop(): void`

Stops emitting values and unsubscribes from the observable. Can be called
from any state.

#### `pause(): void`

Pauses the stream. Incoming values from the source are buffered. Only works
from `running` state.

#### `resume(): void`

Resumes the stream and re-emits all buffered values (in order, with
relative timing). Only works from `paused` state.

#### `command(action: 'start' | 'stop' | 'pause' | 'resume'): void`

Executes a control action programmatically.

#### `state: 'stopped' | 'running' | 'paused'` (read-only)

Returns the current state of the pausable wrapper.

## State Machine

The pausable wrapper implements a simple state machine:

```
stopped ──start()──> running ──pause()──> paused
   ↑                    │                    │
   │                    │                    │
   └────────────────stop()──────────────resume()
```

**States:**

- `stopped`: Initial state, not forwarding values from source
- `running`: Actively forwarding values from source to observer
- `paused`: Stream paused; source values are buffered until `resume()`

**Invalid transitions are ignored:**

- `start()` when already `running` or `paused`
- `pause()` when `stopped` or already `paused`
- `resume()` when `stopped` or `running`

## Behavior Notes

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
