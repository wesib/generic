import { AfterEvent, digAfter_ } from '@proc7ts/fun-events';
import { Class, valuesProvider } from '@proc7ts/primitives';
import {
  ComponentClass,
  ComponentInstance,
  ComponentProperty,
  ComponentPropertyDecorator,
  DefinitionContext,
  DefinitionSetup,
} from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShare__symbol } from './component-share-ref';
import { ShareAccessor } from './share-accessor.impl';
import { SharedValue$ContextBuilder } from './shared-value.impl';
import { targetComponentShare, TargetComponentShare } from './target-component-share';

/**
 * Builds a decorator of component property that {@link ComponentShare shares} its value.
 *
 * The decorated property should return either a static value, or its `AfterEvent` keeper if the case the value is
 * updatable.
 *
 * Applies current component context to `Contextual` shared values.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Target component share.
 * @param define - Sharing property definition builders.
 *
 * @returns Component property decorator.
 */
export function Shared<T, TClass extends ComponentClass = Class>(
    share: TargetComponentShare<T>,
    ...define: Shared.Definer<T, TClass>[]
): ComponentShareDecorator<T, TClass> {

  const { share: { [ComponentShare__symbol]: shr }, local } = targetComponentShare(share);

  return ComponentProperty(
      descriptor => {

        const accessorKey = Symbol(`${String(descriptor.key)}:shared`);

        type Component = ComponentInstance<InstanceType<TClass>> & {
          [accessorKey]?: ShareAccessor<T, TClass>;
        };

        const accessor = (component: Component): ShareAccessor<T, TClass> => component[accessorKey]
            || (component[accessorKey] = new ShareAccessor(descriptor, component));

        return {
          get: component => accessor(component).get(),
          set: descriptor.writable
              ? (component, value) => accessor(component).set(value)
              : undefined,
          componentDef: {
            setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
              setup.perComponent(SharedValue$ContextBuilder(
                  shr,
                  {
                    provide: context => context.onceReady.do(
                        digAfter_(
                            ({ component }) => accessor(component).val,
                            valuesProvider<[T?]>(),
                        ),
                    ),
                  },
              ));
            },
            define(defContext: DefinitionContext<InstanceType<TClass>>) {
              shr.addSharer(defContext, { local });
            },
          },
        };


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
