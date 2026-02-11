# Changelog

All notable changes to this project will be documented in this file.

<details>
<summary>

## **[0.0.4] - 11/02/2026** => _14:01_

</summary>

### Refactor

- 🔧 Réorganiser la configuration de Vitest pour simplifier les plugins
- ♻️ Supprimer le plugin `@bemedev/vitest-exclude` au profit de
  `defaultExclude`
- 📁 Améliorer la structure avec `projects` pour une meilleure organisation
  des tests
- 🎯 Optimiser l'exclusion des fichiers de couverture (`**/*/types.ts`)

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
