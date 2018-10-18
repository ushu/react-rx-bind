import * as React from "react"
import { Observable, combineLatest } from "rxjs"
import { map, startWith } from "rxjs/operators"
import componentFromStream from "./componentFromStream"

// Dervies an object type where all the values are Observables
type PropStreams<T> = { [P in keyof T]: Observable<T[P]> }

// Diff / Omit taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-redux/v5/index.d.ts
// which itself took it from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
type Omit<T, K extends keyof T> = Pick<
  T,
  ({ [P in keyof T]: P } &
    { [P in K]: never } & { [x: string]: never; [x: number]: never })[keyof T]
>

// the type returned by bindPropStreams: a function that takes a React component, and return the same components without
// the injected props
export interface Binder<InjectedProps extends object> {
  <P extends InjectedProps>(
    component: React.ComponentType<P>,
  ): React.ComponentType<Omit<P, keyof InjectedProps>>
}

export default function bindPropStreams<Props extends object>(
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
