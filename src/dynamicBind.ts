import * as React from "react"
import { Observable, combineLatest } from "rxjs"
import { map, startWith } from "rxjs/operators"
import componentFromStream from "./utils/componentFromStream"
import { Omit, Binder, DynamicStream } from "./utils/types"

export default function dynamicBind<
  Props extends object,
  ExternalProps extends object
>(
  dynamicStream: (props$: Observable<ExternalProps>) => Observable<Props>,
  defaultValues?: Props,
): Binder<Props, ExternalProps> {
  return <P extends Props>(component: React.ComponentType<P>) =>
    componentFromStream<Omit<P, keyof Props> & ExternalProps>(props$ => {
      let dynamicProps$: Observable<Props> = dynamicStream(props$)

      // add defaults (when applicable)
      // -> we simply derive a new stream using the startWith() operator, when applicable
      if (defaultValues) {
        dynamicProps$ = dynamicProps$.pipe(startWith(defaultValues))
      }

      return combineLatest(props$, dynamicProps$).pipe(
        // we take the input props, and merge them with the injected props
        map(
          ([props, dynamicProps]) =>
            Object.assign({}, props, dynamicProps) as P & ExternalProps,
        ),
        // and then instanciate the component
        map(props => React.createElement(component, props)),
      )
    })
}
