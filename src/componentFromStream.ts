import * as React from "react"
import { Observable, ReplaySubject, Subscription } from "rxjs"

type StreamToNodeMapper<P extends object> = (
  props$: Observable<P>,
) => Observable<React.ReactNode>

interface State {
  // the last rendered element, or null
  el: React.ReactNode | null
}

/**
 * Builds a React Components from a RxJS stream of React nodes.
 *
 * @param mapper a function that, given a stream of props (the actual props of the generated React Component)
 *               returns a stream of React Nodes (or JSX elements) to render on the page.
 * @returns a React Component
 *
 * @example
 *
 *      // given a RxJS stream
 *      const tick$ = interval(1000)
 *      // we can create a React component (here from JSX)
 *      const TickComponent = componentFromStream(props$ =>
 *        // NOTE: props$ holds the React props received from parent
 *        //       → usually you will combine them with external stream(s)
 *        combineLatest(props$, tick$).pipe(
 *          map(([props, tick]) => <h4 {...props}>{tick} ticks !</h4>)
 *        )
 *      )
 *
 *      // then the component can be used as any other React Component
 *      // for ex. through JSX:
 *
 *      renderTick() {
 *          // the props$ stream will emit {color: "blue"}
 *          return <TickComponent color="blue" />
 *      }
 *
 * @example
 *
 *      // often, you will just ignore the generated props$ stream
 *      const tick$ = interval(1000)
 *      const TickComponent = componentFromStream(() =>
 *        tick$.pipe(
 *          map(tick => <h4>Ticked {tick} times !</h4>)
 *        )
 *      )
 */
export default function componentFromStream<P extends object>(
  mapper: StreamToNodeMapper<P>,
): React.ComponentType<P> {
  // a Subject of props
  const subject = new ReplaySubject<P>(1)
  // and the stream of React Nodes (usually JSX elements)
  const nodes$ = mapper(subject.asObservable())

  return class extends React.PureComponent<P, State> {
    state = {
      el: null,
    }
    subscription?: Subscription

    constructor(props: P) {
      super(props)
      // push initial props
      subject.next(props)
    }

    componentDidMount() {
      this.subscription = nodes$.subscribe({
        // each time the child node is updated, we call setState() to re-render
        next: (el: React.ReactNode) => this.setState({ el }),
      })
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
    }

    componentDidUpdate(prevProps: P) {
      // each time props change, we re-push then to the stream
      if (this.props !== prevProps) {
        subject.next(this.props)
      }
    }

    render() {
      return this.state.el
    }
  }
}
