# Bind RxJS 6 stream as props on React components

This package provides simple helpers to inject RxJS stream values as props.

## Getting Started

```
$ npm install react-rx-bind
```

or

```
$ yarn add rect-rx-bind
```

There is also a UMD build for use in the browser.
The minified version is available on _unpkg_ and defines a global `RxBind` constant:

```html
<script src="https://unpkg.com/react-rx-bind@0.3.0/dist/react-rx-bind-0.3.0.umd.js"></script>
<script>
  const {bind} = RxBind
  // ...
</script>
```

### Usage

### `bind`

`bind` subscribes to a set of streams and update the component props accordingly.

with tree shaking:

```javascript
import { bind } from "react-rx-bind"
```

or:

```javascript
import bind from "react-rx-bind/bind"
```

In the following example, we inject a `tick` prop containing the current tiker value:

```javascript
// a simple React component
const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

// and a RxJS stream that ticks every second
const tick$ = interval(1000)

// Using the "bind" HOC we can inject the latest value of "tick$" into the "tick" prop
const ConnectedTicker = bind({ tick: tick$ })(Ticker)

// now we can use the connected component anywhere: it will substribe on mount and
// unsubscribe on unmount automatically
const App = () => (
  <div>
    <ConnectedTicker />
  </div>
)
```

This function can also be used to create custom Higher-Order Components that inject a set of props from named streams:

```javascript
const tick$ = interval(1000)

// A HOC that injects the current "tick$" value
const withTick = bind({ tick: tick$ })

// usage:
const Ticker = withTick(({ tick }) => <h4>tick: {tick}</h4>)
```

`bind` also supports _default values_ as an optional second argument:

```javascript
// a stream that emits "name", with a 5s delay
const name$ = of("John").pipe(delay(5000))

const Name = ({ name }) => <span>My name is {name}</span>
const ConnectedName = bind(
  // injects the "name" prop with the latest value from "name$"
  { name: name$ },
  // and defaults "name" to an initial value of "loading..."
  { name: "loading..." },
)(Name)
```

### `bindStream`

`bindStream` is a lower-lever version of `bind` that expects an **`Observable` of props** and injects it into the child component.

with tree shaking:

```javascript
import { bindStream } from "react-rx-bind"
```

or:

```javascript
import bindStream from "react-rx-bind/bindStream"
```

We can re-create the `Ticker` example above as follows:

```javascript
// the same React component
const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

// and ticker obersable
const tick$ = interval(1000)

// now we create a stream of props
const injectedProps$ = tick$.pipe(
  // we build an object of props to inject, here it has only key: "tick"
  map(tick => ({ tick })),
)

// and use bindStream "connect" the component
const ConnectedTicker = bindStream(injectedProps$)(Ticker)
```

## Additional utility functions

The functions describes above are used internally by the `bind` and `bindStream`, but might come useful in some situations.

**NOTICE: for most use cases, you will probably be better served using utility functions from [recompose]. These utility functions are mostly present to avoid a dependency to [recompose] and use the same naming, but have less options than their original counterparts**

### `componentFromStream`

`componentFromStream` builds a React component from a RxJS stream.

with tree shaking:

```javascript
import { componentFromStream } from "react-rx-bind/utils"
```

or:

```javascript
import componentFromStream from "react-rx-bind/utils/componentFromStream"
```

Build a new React component using a callback that, given a stream of props (received from the parent React component) must output a stream of React nodes (or JSX elements).

For example, given a stream of numbers, we might want to update the UI on each new value:

```javascript
// increments every second
const tick$ = interval(1000)

// We create the TickComponent React component
const TickComponent = componentFromStream(props$ =>
  // props$ is the stream of props received for the parent component
  combineLatest(props$, tick$).pipe(
    // each time either props$ or tick$ emits a new value
    map(([props, tick]) => (
      // we render a new React node
      <h4 {...props}>{tick} ticks !</h4>
    )),
  ),
)
```

The `props$` stream holds the value of the props received by the React component. Often, we build components that do not change depending on their recieved props: in this case we can just ignore the `props$` stream completely.

```javascript
const tick$ = interval(1000)

const TickComponent = componentFromStream(() =>
  // we must return a stream of React nodes
  tick$.pipe(map(tick => <h4>{tick} ticks !</h4>)),
)
```

#### TypeScript support

When using TypeScript, you can give the type of the expected props for the newly-generated component:

```typescript
interface Props {
  value: number
}

// props$ is typed Observalbe<Props>
const TickComponent = componentFromStream<Props>(props$ =>
  props$.pipe(map(props => <h4>value is {props.value}</h4>)),
)
```

### `createEventHandler`

`createEventHandler` create a pair of stream & handler for use in React components.

with tree shaking:

```javascript
import { createEventHandler } from "react-rx-bind/utils"
```

or:

```javascript
import createEventHandler from "react-rx-bind/utils/createEventHandler"
```

A typical use case would be to use the handler as an `onClick` listener:

```javascript
 class MyComponent extends React.Component {
   state = {
     active: false
   }
   toggle = createEventHandler()

   componentDidMount() {
     // on each "click", we want to update the state
     this.subscription = this.toggle.stream.subscribe({
       next: () => this.setState(state => ({
         active: !state.active
       })))
     })
   }

   componentWillUnmount() {
     this.subscription.unsubscribe()
   }

   render() {
     const {active} = this.state
     // we can directly use the "handler" field as the onClick handler
     return <button onClick={this.toggle.handler}>
       {active ? "ACTIVE" : "INACTIVE"}
     </button>
   }
 }
```

#### TypeScript support

When using TypeScript, you can give the type of the payload for the handler:

```typescript
const changeName = createEventHandler<string>()

// changeName.stream is of type Observable<string>
changeName.stream.subscribe({
  next: s => console.log(s),
})

// changeName.handler expects string arguments:
changeName.handler("test") // prints "test"
```

## Development setup

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## TODO

- [x] Add docs & examples

[recompose]: https://github.com/acdlite/recompose
