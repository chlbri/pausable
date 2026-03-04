# Changelog

All notable changes to this project will be documented in this file.

<details>
<summary>

## **[1.0.3] - 04/03/2026** => _00:07_

</summary>

### Features

- ♻️ `start()` now fully resets internal state (fresh `Subject`, cleared event buffer, reset `lastPaused` and `hasBeenPaused`), enabling true restart after `stop()`

### Refactor

- 🔀 Move `arrayObserver` and `startObserver` definitions inside `start()` so each call gets a clean subscription context
- 🏗️ Lazily initialise `subject$` and `_source$` — they are now created on each `start()` call instead of at construction time
- 🛡️ Simplify `resume()` guard: `command !== 'pause'` replaces the previous two-condition check
- 🔒 `RESUME_ACTIONS.error` now also sets `command = 'stop'` before completing the subject, ensuring consistent state after an error replay
- ✅ Add test cases #34–#44 covering restart after a full stop (verifies clean state and correct re-emission from a fresh `interval`)

</details>

<br/>

<details>
<summary>

## **[1.0.2] - 03/03/2026** => _12:35_

</summary>

### Docs

- 📝 Add JSDoc comments to all exported types in `src/types.ts` (`SubArgs`, `Command`, `State`, `Pausable`, `CreatePausable_F`, `Delayed`)
- 📝 Add JSDoc to `perform` helper in `src/helpers.ts`
- 📝 Add JSDoc to `createPausable` in `src/index.ts`, including `@example` usage
- 📝 Document all internal variables and methods inside `createPausable` (`lastPaused`, `events`, `canClear`, `perform`, `RESUME_ACTIONS`, `startObserver`, `out.*`)

### Refactor

- 🏷️ Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for the `timer` parameter in the internal `perform` wrapper for cross-runtime compatibility

</details>

<br/>

<details>
<summary>

## **[1.0.1] - 03/03/2026** => _12:21_

</summary>

### Refactor

- ♻️ Extract `perform` utility into new `src/helpers.ts` module
- 🔄 Move `Delayed<T>` type from `src/index.ts` to `src/types.ts` and export it
- 🏷️ Rename internal `array` buffer to `events` for clarity
- 🧩 Extract `RESUME_ACTIONS` object to centralize resume event dispatching
- 🧩 Extract `startObserver` object to separate start-phase subscription logic
- 🗂️ Group all control methods (`start`, `stop`, `pause`, `resume`, `command`) into a single `out` object using method shorthand syntax
- ↩️ `start()` now returns the RxJS subscription created internally

</details>

<br/>

<details>
<summary>

## **[1.0.0] - 03/03/2026** => _02:19_

</summary>

### Breaking Changes

- ♻️ Complete rewrite of `createPausable` internal implementation —
  replaced RxJS pipeline (`scan`, `switchMap`, `startWith`, `EMPTY`) with a
  custom time-based buffering system

### Features

- ✨ Add `state` getter on `Pausable` — returns `'stopped'` | `'running'` |
  `'paused'`
- 🔄 Values and errors emitted during pause are now buffered and re-emitted
  after `resume()` with correct relative timing
- 📦 Add exported `Command` type in `src/types.ts`

### Refactor

- 🧪 Refactor tests — introduce `usePrepare()` helper for better isolation
  per `describe` block
- 🗂️ Convert nested `it()` calls into numbered `describe()` blocks for
  better organization

### Dependencies

- 🔼 Update `@types/node` `^25.3.2` → `^25.3.3`
- 🔼 Update `globals` `^17.3.0` → `^17.4.0`
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.2.0] - 27/02/2026** => _20:41_

</summary>

### Dependencies

- Export all types from `src/types.ts` in `index.ts` for better type
  accessibility
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.1.0] - 18/02/2026** => _15:01_

</summary>

### Refactor

- 🎯 Fix coverage exclusion for `types.ts` (pattern `**/types.ts`)
- ➕ Add `include: ['src/**/*.ts']` to coverage config to scope
  instrumented files
- ✅ Ensure `types.ts` no longer appears in coverage report
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.0.4] - 11/02/2026** => _14:01_

</summary>

### Refactor

- 🔧 Reorganize Vitest configuration to simplify plugins
- ♻️ Remove `@bemedev/vitest-exclude` plugin in favor of `defaultExclude`
- 📁 Improve structure with `projects` for better test organization
- 🎯 Optimize coverage file exclusion (`**/*/types.ts`)

### Dependencies

- 📦 Update pnpm-lock.yaml (optimize dependencies)
- 🔼 Bump version to 0.0.4
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.0.3] - 10/02/2026** => _10:00_

</summary>

### Dependencies

- 📦 Update pnpm-lock.yaml (optimize dependencies)
- 🔼 Bump version to 0.0.3
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.0.2] - 08/01/2026** => _09:13_

</summary>

### Documentation

- 📝 Update README.md with comprehensive documentation
- 📚 Add complete API documentation with usage examples
- 📋 Add test numerotation rules in `.github/rules/test.rules.md`
- 🔗 Update links to repository, npm package, and documentation
- ✨ Add installation instructions for npm, pnpm, and yarn
- 📖 Add state machine diagram and behavior explanations
- 🎯 Add TypeScript usage examples
- 📦 Update package.json version to 0.0.2

### Tests

- 🔢 Add numerotation to all test `describe` and `it` blocks
- 📋 Follow test numerotation rules (sequential numbering)
- ✅ Maintain 100% test coverage
- <u>Test coverage **_100%_**</u>

### Refactor

- 🧹 Remove old CHANGE_LOG.md in favor of CHANGELOG.md
- 📝 Update prompt documentation with test rules reference

</details>

<br/>

<details>
<summary>

## **[0.0.1] - 08/01/2026** => _09:10_

</summary>

### Features

- ✨ Add `createPausable` utility function for RxJS observables
- 🎛️ Implement state machine with `start`, `stop`, `pause`, and `resume`
  controls
- 🔄 Add `command()` method for programmatic state control
- 📦 Support multiple observer types (function, partial, full, or
  undefined)
- 🔌 Proper subscription lifecycle management with unsubscribe on
  pause/stop

### Documentation

- 📝 Add comprehensive test suite with 23 test cases
- 📋 Add test numerotation rules in `.github/rules/test.rules.md`
- 📚 Add RxJS documentation in `.github/docs/rxjs.md`
- 🔧 Update package.json with description, keywords, and repository URL
- ⚙️ Set Node.js engine requirement to >= 22 (LTS)

### Tests

- ✅ Test coverage: initial state, start/stop/pause/resume operations
- ✅ Test complex state transitions
- ✅ Test observer type compatibility (function, partial, full)
- ✅ Test error handling and completion propagation
- ✅ Integration tests with RxJS operators (interval, take)
- <u>Test coverage **_100%_**</u>

### Technical Details

- Pause/resume semantics: unsubscribes on pause, fresh subscription on
  resume
- State machine prevents invalid transitions
- Cold observables restart from beginning after resume
- Full lifecycle support: next, error, complete forwarding

</details>

<br/>
