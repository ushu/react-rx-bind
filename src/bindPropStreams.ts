import * as React from "react"
import { Observable, combineLatest } from "rxjs"
import { map, startWith } from "rxjs/operators"
import bindProps, { Binder } from "./bindProps"

// Dervies an object type where all the values are Observables
type PropStreams<T> = { [P in keyof T]: Observable<T[P]> }

// Diff / Omit taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-redux/v5/index.d.ts
// which itself took it from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
type Omit<T, K extends keyof T> = Pick<
  T,
  ({ [P in keyof T]: P } &
    { [P in K]: never } & { [x: string]: never; [x: number]: never })[keyof T]
>

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

  return bindProps(injectedProps$)
}
