import * as React from "react"
import { Observable, combineLatest } from "rxjs"
import { map, startWith } from "rxjs/operators"
import componentFromStream from "./utils/componentFromStream"
import { Omit, Binder } from "./utils/types"

/**
 Injects props from a "stream of props" into a React component.

 @param injectedProps an `Observable` emitting `object`s injected as the component props.
 @returns a HOC injecting the props form `injectedProps$` to the provided component.

 @example

 ```
 // given a RxJS stream of props
 const tick$ = interval(1000)
 const props$ = tick$.pipe(
   map(tick => ({
     tick,
   }))
 )

 // and a React component
 const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

 // bindStream will create a new component, with the "tick" value injected
 const withTick = bindStream(props$)
 const ConnectedTicker = withTick(Ticker)
 ```
 */
export default function bindStream<Props extends object>(
  injectedProps$: Observable<Props>,
  defaultValues?: Props,
): Binder<Props> {
  // add defaults (when applicable)
  // -> we simply derive a new stream using the startWith() operator, when applicable
  if (defaultValues) {
    injectedProps$ = injectedProps$.pipe(startWith(defaultValues))
  }

  return <P extends Props>(component: React.ComponentType<P>) =>
    componentFromStream<Omit<P, keyof Props>>(props$ =>
      combineLatest(props$, injectedProps$).pipe(
        // we take the input props, and merge them with the injected props
        map(
          ([props, injectedProps]) =>
            Object.assign({}, props, injectedProps) as P,
        ),
        // and then instanciate the component
        map(props => React.createElement(component, props)),
      ),
    )
}
