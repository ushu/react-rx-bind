import { Observable } from "rxjs"
import * as React from "react"
import dynamicBind from "./dynamicBind"
import { Binder } from "./utils/types"

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
  return dynamicBind<Props, {}>(() => injectedProps$, defaultValues)
}
