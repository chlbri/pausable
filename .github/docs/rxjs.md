# RxJS Documentation

## Overview

RxJS (Reactive Extensions for JavaScript) is a library for composing asynchronous and event-based programs by using observable sequences. It provides one core type, the Observable, satellite types (Observer, Schedulers, Subjects) and operators inspired by Array methods to allow handling asynchronous events as collections.

**Think of RxJS as Lodash for events.**

RxJS combines the Observer pattern with the Iterator pattern and functional programming with collections to fill the need for an ideal way of managing sequences of events.

## Installation

```bash
npm install rxjs
```

## Core Concepts

### 1. Observable

Represents the idea of an invokable collection of future values or events. Observables are lazy Push collections of multiple values.

**Basic Example:**

```typescript
import { Observable } from 'rxjs';

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});
```

### 2. Observer

A collection of callbacks that knows how to listen to values delivered by the Observable.

```typescript
const observer = {
  next: (x) => console.log('Observer got a next value: ' + x),
  error: (err) => console.error('Observer got an error: ' + err),
  complete: () => console.log('Observer got a complete notification'),
};
```

### 3. Subscription

Represents the execution of an Observable, primarily useful for cancelling the execution.

```typescript
const subscription = observable.subscribe(observer);

// Later, cancel the subscription
subscription.unsubscribe();
```

### 4. Operators

Pure functions that enable a functional programming style of dealing with collections with operations like `map`, `filter`, `concat`, `reduce`, etc.

```typescript
import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(
    filter((x) => x % 2 === 0),
    map((x) => x * 10)
  )
  .subscribe((x) => console.log(x)); // 20, 40
```

### 5. Subject

Equivalent to an EventEmitter, and the only way of multicasting a value or event to multiple Observers.

```typescript
import { Subject } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`),
});

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`),
});

subject.next(1);
subject.next(2);
```

### 6. Schedulers

Centralized dispatchers to control concurrency, allowing us to coordinate when computation happens on e.g. `setTimeout` or `requestAnimationFrame`.

## Key Advantages

### Purity

RxJS allows you to produce values using pure functions, making your code less prone to errors.

**Without RxJS:**
```typescript
let count = 0;
document.addEventListener('click', () => console.log(`Clicked ${++count} times`));
```

**With RxJS:**
```typescript
import { fromEvent, scan } from 'rxjs';

fromEvent(document, 'click')
  .pipe(scan((count) => count + 1, 0))
  .subscribe((count) => console.log(`Clicked ${count} times`));
```

### Flow Control

RxJS provides operators to control how events flow through observables.

```typescript
import { fromEvent, throttleTime, scan } from 'rxjs';

fromEvent(document, 'click')
  .pipe(
    throttleTime(1000),
    scan((count) => count + 1, 0)
  )
  .subscribe((count) => console.log(`Clicked ${count} times`));
```

### Value Transformation

Transform values passed through your observables.

```typescript
import { fromEvent, throttleTime, map, scan } from 'rxjs';

fromEvent(document, 'click')
  .pipe(
    throttleTime(1000),
    map((event) => event.clientX),
    scan((count, clientX) => count + clientX, 0)
  )
  .subscribe((count) => console.log(count));
```

## Common Operators

### Creation Operators

- `of(...)` - Emits the arguments you provide, then completes
- `from(...)` - Converts an array, promise, or iterable into an observable
- `interval(ms)` - Emits sequential numbers at specified intervals
- `timer(ms)` - Emits after a specified delay
- `fromEvent(target, event)` - Creates an observable from DOM events

### Transformation Operators

- `map(fn)` - Transforms each value
- `pluck(property)` - Picks a property from each value
- `mergeMap/flatMap(fn)` - Maps and flattens
- `switchMap(fn)` - Maps to inner observable, cancels previous
- `concatMap(fn)` - Maps to inner observable, waits for completion

### Filtering Operators

- `filter(predicate)` - Emits values that pass a condition
- `take(n)` - Takes the first n values
- `takeUntil(notifier)` - Takes values until notifier emits
- `takeWhile(predicate)` - Takes values while condition is true
- `skip(n)` - Skips the first n values
- `debounceTime(ms)` - Emits value after silence period
- `throttleTime(ms)` - Emits value then ignores for duration
- `distinct()` - Emits only distinct values
- `distinctUntilChanged()` - Emits when value differs from previous

### Combination Operators

- `merge(...)` - Merges multiple observables
- `concat(...)` - Concatenates observables sequentially
- `combineLatest(...)` - Combines latest values from all
- `zip(...)` - Combines values by index
- `withLatestFrom(...)` - Combines with latest from another observable
- `startWith(value)` - Starts with initial value

### Error Handling Operators

- `catchError(fn)` - Catches errors and returns a new observable
- `retry(n)` - Retries on error
- `retryWhen(fn)` - Retries based on custom logic

### Utility Operators

- `tap(fn)` - Performs side effects without modifying the stream
- `delay(ms)` - Delays emissions
- `timeout(ms)` - Errors if no emission within time
- `finalize(fn)` - Executes when observable completes or errors

## Observable vs Promise

| Feature | Observable | Promise |
|---------|-----------|---------|
| Eager/Lazy | Lazy (doesn't execute until subscribed) | Eager (executes immediately) |
| Cancellable | Yes (via unsubscribe) | No |
| Multiple values | Yes | No (single value) |
| Operators | Rich set of operators | Limited (then, catch) |
| Multicast | Can be multicasted | Always unicast |

## Pull vs Push

**Pull Systems:** Consumer determines when it receives data (Functions, Iterators)

**Push Systems:** Producer determines when to send data (Promises, Observables)

## Best Practices

1. **Always unsubscribe** to prevent memory leaks
   ```typescript
   const subscription = observable.subscribe();
   // Later...
   subscription.unsubscribe();
   ```

2. **Use operators instead of manual subscription logic**
   ```typescript
   // Good
   source$.pipe(map(x => x * 2)).subscribe();
   
   // Avoid
   source$.subscribe(x => {
     const doubled = x * 2;
     // ...
   });
   ```

3. **Prefer async pipe in Angular** to auto-manage subscriptions

4. **Use subjects sparingly** - they're stateful and can make code harder to reason about

5. **Compose operators** for better reusability
   ```typescript
   const multiplyBy = (factor: number) => (source: Observable<number>) =>
     source.pipe(map(x => x * factor));
   ```

6. **Handle errors appropriately**
   ```typescript
   observable$.pipe(
     catchError(error => {
       console.error('Error:', error);
       return of(defaultValue);
     })
   ).subscribe();
   ```

## Common Patterns

### Debouncing User Input

```typescript
import { fromEvent } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

const searchBox = document.getElementById('search');

fromEvent(searchBox, 'input')
  .pipe(
    map(event => event.target.value),
    debounceTime(300),
    distinctUntilChanged()
  )
  .subscribe(value => console.log('Search:', value));
```

### HTTP Requests with Cancellation

```typescript
import { fromEvent, ajax } from 'rxjs';
import { switchMap, debounceTime } from 'rxjs/operators';

fromEvent(searchBox, 'input')
  .pipe(
    debounceTime(300),
    switchMap(event => ajax.getJSON(`/api/search?q=${event.target.value}`))
  )
  .subscribe(results => console.log(results));
```

### Retry Logic

```typescript
import { ajax } from 'rxjs/ajax';
import { retry, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

ajax.getJSON('/api/data')
  .pipe(
    retry(3),
    catchError(error => {
      console.error('Failed after 3 retries:', error);
      return of([]);
    })
  )
  .subscribe(data => console.log(data));
```

### Polling

```typescript
import { interval } from 'rxjs';
import { switchMap, retry } from 'rxjs/operators';

interval(5000)
  .pipe(
    switchMap(() => ajax.getJSON('/api/status')),
    retry(2)
  )
  .subscribe(status => console.log('Status:', status));
```

## Resources

- Official Documentation: https://rxjs.dev
- GitHub Repository: https://github.com/ReactiveX/rxjs
- RxJS Marbles (Visual Operator Reference): https://rxmarbles.com
- Learn RxJS: https://www.learnrxjs.io

## Version Information

This documentation is based on RxJS 7.x and 8.x. For specific version details, refer to the official documentation.