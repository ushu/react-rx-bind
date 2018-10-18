import { Subject, Observable } from "rxjs"

/**
 * @type EventHandler
 * @field handler a function that takes a payload to pass the the stream
 * @stream a RxJS Obserbale
 */
export interface EventHandler<T> {
  handler: (next: T) => void
  stream: Observable<T>
}

/**
 * Creates a custom `stream` (an RxJS Observable) of events and an associated `handler` function to push events in the stream.
 *
 * @returns {EventHandler} an object with keys `handler` and `stream`
 *
 * @example
 *
 *  // we create the handler
 *  const { handler, stream } = createEventHandler()
 *  // then we subscribe to the stream
 *  stream.subscribe(next => console.log("next"))
 *  // now we can push values down to the stream using the "handler"
 *  handler("Hello, world") // -> will log "Hello, world"
 *
 * @example
 *
 *  // example using React
 *  class MyComponent extends React.Component {
 *    state = {
 *      active: false
 *    }
 *    // we create the event handler
 *    toggle = createEventHandler()
 *
 *    componentDidMount() {
 *      // on mount we subribe for changes
 *      this.subscription = this.toggle.stream.subscribe({
 *        next: () => this.setState(state => ({
 *          active: !state.active
 *        })))
 *      })
 *    }
 *
 *    componentWillUnmount() {
 *      // on unmount we unsubscribe
 *      this.subscription.unsubscribe()
 *    }
 *
 *    render() {
 *      const {active} = this.state
 *      // we user the handler() function as the onClick handler
 *      return <button onClick={this.toggle.handler}>
 *        {active ? "ACTIVE" : "INACTIVE"}
 *      </button>
 *    }
 *  }
 */
export default function createEventHandler<T>(): EventHandler<T> {
  const subject = new Subject<T>()
  return {
    handler: subject.emit.bind(subject),
    stream: subject.asObservable(),
  }
}
