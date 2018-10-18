import * as React from "react"
import { Observable, ReplaySubject, Subscription } from "rxjs"

type StreamToNodeMapper<P extends object> = (
  props$: Observable<P>,
) => Observable<React.ReactNode>

interface State {
  // the last rendered element, or null
  el: React.ReactNode | null
}

export function componentFromStream<P extends object>(
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
        next: el => this.setState({ el }),
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
