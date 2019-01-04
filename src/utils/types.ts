import { Observable } from "rxjs"

// Diff / Omit taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-redux/v5/index.d.ts
// which itself took it from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
export type Omit<T, K extends keyof T> = Pick<
  T,
  ({ [P in keyof T]: P } &
    { [P in K]: never } & { [x: string]: never; [x: number]: never })[keyof T]
>

// the type returned by bind & bindStream: a function that takes a React component, and return the same components without
// the injected props
export interface Binder<InjectedProps extends object> {
  <P extends InjectedProps>(
    component: React.ComponentType<P>,
  ): React.ComponentType<Omit<P, keyof InjectedProps>>
}

// Derives an object type where all the values are Observables
export type PropStreams<T> = { [P in keyof T]: Observable<T[P]> }
