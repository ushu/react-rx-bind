# Utilities for React and RxJS 6

This package provides simple helpers for mixing React with RxJS 6.

**NOTICE: for most use cases, you will probably be better served using the RxJS functions of [recompose]. I built this package to have a better support of RxJS 6 with TypeScript: unless you have faced the same issues, `react-rxjs-utils` might not be the best option.**

## Getting Started

```
$ npm install react-rxjs-utils
```

### Usage

### `componentFromStream`

`componentFromStream` builds a React component from a RxJS stream.

with tree shaking:

```javascript
import { componentFromStream } from "react-rxjs-utils"
```

or:

```javascript
import componentFromStream from "react-rxjs-utils/componentFromStream"
```

This function builds a new React component, giving a stream of props (received from the parent React component) and expects a stream of React nodes (or JSX elements).

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
import { createEventHandler } from "react-rxjs-utils"
```

or:

```javascript
import createEventHandler from "react-rxjs-utils/createEventHandler"
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

### `bindProps`

`bindProps` subscribes to a set of streams and update the component props accordingly.

with tree shaking:

```javascript
import { bindProps } from "react-rxjs-utils"
```

or:

```javascript
import bindProps from "react-rxjs-utils/bindProps"
```

A basic usage is to update the UI of a component from a set of live streams:

```javascript
// a simple React component
const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

// the same component, connected to a RxJS stream
const tick$ = interval(1000)
const ConnectedTicker = bindProps({
  // will inject a "tick" prop with the current value of "tick$"
  tick: tick$,
})(Ticker)

// now we can use this component anywhere, without the need to provide the injected "tick" props:
const App = () => (
  <div>
    <ConnectedTicker />
  </div>
)
```

This function can also be used to create Higher-Order components that inject a set of props from named streams:

```javascript
const tick$ = interval(1000)

// A HOC that injects the current "tick$" value
const withTick = bindProps({ tick: tick$ })

// example usage
const Ticker = withTick(({ tick }) => <h4>tick: {tick}</h4>)
```

The function also supports _default values_ as an optional second argument:

```javascript
// a stream that emits "name", with a 5s delay
const name$ = of("John").pipe(delay(5000))

const Name = ({ name }) => <span>My name is {name}</span>
const ConnectedName = bindProps(
  // injects the "name" prop with the value of "name$"
  { name: name$ },
  // and defaults "name" to an initial value of "loading..."
  { name: "loading..." },
)(Name)
```

### `bind`

`bind` is a lower-lever version of `bindProps` that expects an `Observable` of props and injects it into the child component.

with tree shaking:

```javascript
import { bind } from "react-rxjs-utils"
```

or:

```javascript
import bind from "react-rxjs-utils/bind"
```

We can re-create the `Ticker` example above as follows:

```javascript
// a simple React component
const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

// the same component, connected to a RxJS stream
const tick$ = interval(1000)
const injectedProps$ = tick$.pipe(
  // we build an object of props to inject
  map(tick => ({ tick })),
)

// and then we can "connect" the component
const ConnectedTicker = bind(injectedProps$)(Ticker)
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## TODO

- [ ] Add docs & examples

[recompose]: https://github.com/acdlite/recompose
