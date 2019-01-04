import { Observable, combineLatest } from "rxjs"
import { map, startWith } from "rxjs/operators"
import bindStream from "./bindStream"
import { Binder, PropStreams } from "./utils/types"

/**
 Subscribes to a set of RxJS streams (`Observable`s) and expose their current value as props to the React component.
 
 @param streams an object whos keys as `string`s and values `Observable`s
 @param defaultValues an optional object with the same keys as `streams` and holding default values for the injected props.
 @returns a "binder" HOC, that takes any React components and inject it with the provided props.
 
 @example

 ```
 // given a stream
 const tick$ = interval(1000)

 // and a React component
 const Ticker = ({ tick }) => <h4>tick: {tick}</h4>

 // bind can inject the stream values as a props
 const withTick = bind({ tick: tick$ })
 const ConnectedTicker = withTick(Ticker)

 // the ConnectedTicker component has no required props: "tick" is injected 
 class App extends React.Component {
   //...
   renderTicker() {
     return <ConnectedTicker />
   }
   //...
 }
 ```

 @example

 ```
 // when one of the streams has no "current value"
 const tick$ = interval(1000)
 const delayedTick$ = tick$.pipe(delay(5000))

 // you can provide default values for the props
 const Ticker = bind({
   tick1: tick$,
   tick2: delayedTick$,
 }, {
   // default value for the delayed prop, until it emits
   tick2: 0
 })(
   ({tick1, tick2}) => <h4>ticks: {tick1} & {tick2}</h4>
 )
 ```
 */

export default function bind<Props extends object>(
  streams: PropStreams<Props>,
  defaultValues?: Partial<Props>,
): Binder<Props> {
  // the input is an object where all values as Observables
  const propNames = Object.keys(streams)
  let propStreams = Object.values(streams) as Array<Observable<any>>

  // add defaults (when applicable)
  // -> we simply derive a new stream using the startWith() operator, when applicable
  if (defaultValues) {
    propStreams = propStreams.map((stream, index) => {
      // @ts-ignore
      const defaultValue = defaultValues[index]
      return defaultValues ? stream.pipe(startWith(defaultValue)) : stream
    })
  }

  // we build a single Observable returning objects with the same keys as streams,
  // but the last value instead of the stream.
  //
  // if "streams" has signature:
  //    {
  //       isAdmin: Observable<boolean>
  //       count:   Observable<number>
  //    }
  //
  // the injectedProps$ will be an emit the last values, such as:
  //
  //   { isAdmin: true, count: 0 }
  //   { isAdmin: true, count: 1 }
  //   ...
  //
  const injectedProps$: Observable<Props> = combineLatest(...propStreams).pipe(
    map(arrayOfProps => {
      const props: any = []
      for (let i = 0; i < propNames.length; ++i) {
        props[propNames[i]] = arrayOfProps[i]
      }
      return props as Props
    }),
  )

  return bindStream(injectedProps$)
}
