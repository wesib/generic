import { AfterEvent, afterThe, digAfter, isAfterEvent } from '@proc7ts/fun-events';
import { Class, valuesProvider } from '@proc7ts/primitives';
import {
  ComponentClass,
  ComponentDef,
  ComponentProperty,
  ComponentPropertyDecorator,
  DefinitionContext,
  DefinitionSetup,
} from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShare__symbol, ComponentShareRef } from './component-share-ref';
import { SharedByComponent$ContextBuilder } from './shared-by-component.impl';

/**
 * Builds a decorator of component property that {@link ComponentShare shares} its value.
 *
 * The decorated property should return either a static value, or its `AfterEvent` keeper if the case the value is
 * updatable.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Target share reference.
 * @param define - Sharing property definition builders.
 *
 * @returns Component property decorator.
 */
export function Shared<T, TClass extends ComponentClass = Class>(
    share: ComponentShareRef<T>,
    ...define: Shared.Definer<T, TClass>[]
): ComponentShareDecorator<T, TClass> {

  const shr = share[ComponentShare__symbol];

  return ComponentProperty(
      descriptor => {
        ComponentDef.define(
            descriptor.type,
            {
              setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
                setup.perComponent(SharedByComponent$ContextBuilder(
                    shr,
                    {
                      provide: context => context.onceReady.do(
                          digAfter(
                              (): AfterEvent<[T?]> => {

                                const value: T | AfterEvent<[T?]> = context.component[descriptor.key];

                                return isAfterEvent(value) ? value : afterThe(value);
                              },
                              valuesProvider(),
                          ),
                      ),
                    },
                ));
              },
              define(defContext: DefinitionContext<InstanceType<TClass>>) {
                shr.addSharer(defContext);
              },
            },
        );
      },
      ...define.map(define => (
          descriptor: ComponentProperty.Descriptor<T | AfterEvent<[T?]>, TClass>,
      ) => define({ ...descriptor, share: shr })),
  );
}

/**
 * Decorator of component property that {@link ComponentShare shares} its value.
 *
 * Built by {@link Shared @Shared} decorator.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 */
export type ComponentShareDecorator<T, TClass extends ComponentClass = Class> =
    ComponentPropertyDecorator<T | AfterEvent<[T?]>, TClass>;

export namespace Shared {

  /**
   * A descriptor of the component property that {@link ComponentShare shares} its value.
   *
   * Passed to {@link Definer property definer} by {@link Shared @Shared} decorator to build a {@link Definition
   * property definition}.
   *
   * @typeParam T - Shared value type.
   * @typeParam TClass - A type of decorated component class.
   */
  export interface Descriptor<T, TClass extends ComponentClass = Class>
      extends ComponentProperty.Descriptor<T | AfterEvent<[T?]>, TClass> {

    /**
     * Target share instance.
     */
    readonly share: ComponentShare<T>;

  }

  /**
   * A signature of definition builder of the component property that {@link ComponentShare shares} its value.
   *
   * This is a function called by {@link Shared @Shared} decorator to apply additional definitions.
   *
   * @typeParam T - Shared value type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<T, TClass extends ComponentClass = Class> =
  /**
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component property definition, or nothing if the property definition is not to be changed.
   */
      (
          this: void,
          descriptor: Descriptor<T, TClass>,
      ) => Definition<T, TClass> | void;

  /**
   * A definition of component property that {@link ComponentShare shares} its value.
   *
   * @typeParam T - Shared value type.
   * @typeParam TClass - A type of component class.
   */
  export type Definition<T, TClass extends ComponentClass = Class> =
      ComponentProperty.Definition<T | AfterEvent<[T?]>, TClass>;

}
