# @bemedev/rx-pausable

A pausable wrapper for RxJS observables with start, stop, pause, and resume controls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)

## Features

- 🎛️ **State Management**: Control observable streams with `start`, `stop`, `pause`, and `resume`
- 🔄 **Command Interface**: Programmatic control via `command()` method
- 📦 **Flexible Observers**: Support for function, partial, full, or no observer
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
const pausable = createPausable(
  interval(1000),
  value => console.log('Value:', value)
);

// Start emitting values
pausable.start();
// Output: Value: 0, Value: 1, Value: 2...

// Pause the stream (unsubscribes)
pausable.pause();

// Resume the stream (resubscribes - starts from 0 for cold observables)
pausable.resume();

// Stop completely
pausable.stop();
```

### With Full Observer

```typescript
import { Subject } from 'rxjs';
import createPausable from '@bemedev/rx-pausable';

const source$ = new Subject<number>();

const pausable = createPausable(source$, {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!')
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
  tap(value => console.log('Side effect:', value))
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
Starts emitting values from the observable. Only works from `stopped` state.

#### `stop(): void`
Stops emitting values and unsubscribes from the observable. Can be called from any state.

#### `pause(): void`
Pauses the stream and unsubscribes. Only works from `running` state.

#### `resume(): void`
Resumes the stream with a fresh subscription. Only works from `paused` state.

**Note:** For cold observables (like `interval`), resume creates a fresh subscription, so the sequence restarts.

#### `command(action: 'start' | 'stop' | 'pause' | 'resume'): void`
Executes a control action programmatically.

## State Machine

The pausable wrapper implements a simple state machine:

```
stopped ──start()──> running ──pause()──> paused
   ↑                    │                    │
   │                    │                    │
   └────────────────stop()──────────────resume()
```

**States:**
- `stopped`: Initial state, not subscribed to source
- `running`: Actively emitting values from source
- `paused`: Subscription paused (unsubscribed, can resume)

**Invalid transitions are ignored:**
- `start()` when already `running` or `paused`
- `pause()` when `stopped` or already `paused`
- `resume()` when `stopped` or `running`

## Behavior Notes

### Pause/Resume Semantics

When you call `pause()`, the wrapper **unsubscribes** from the source observable. When you call `resume()`, it creates a **fresh subscription**.

For **cold observables** (like `interval`, `range`, etc.), this means the sequence restarts:

```typescript
const pausable = createPausable(interval(100), console.log);
pausable.start();
// Output: 0, 1, 2
pausable.pause();
pausable.resume();
// Output: 0, 1, 2 (restarts from 0)
```

For **hot observables** (like `Subject`), you'll only receive values emitted after resume:

```typescript
const subject$ = new Subject<number>();
const pausable = createPausable(subject$, console.log);
pausable.start();
subject$.next(1); // Output: 1
pausable.pause();
subject$.next(2); // No output (paused)
pausable.resume();
subject$.next(3); // Output: 3
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

Contributions are welcome! Please follow the test numerotation rules defined in [.github/rules/test.rules.md](.github/rules/test.rules.md) when adding tests.

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