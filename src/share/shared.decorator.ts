import { EventKeeper } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
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

/**
 * Builds a component property decorator that {@link ComponentShare shares} a property value.
 *
 * The decorated property should return either a static value, or its `EventKeeper` if the case the value is updatable.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Target share reference.
 * @param definers - Component share definers to apply.
 *
 * @returns Component property decorator.
 */
export function Shared<T, TClass extends ComponentClass = Class>(
    share: ComponentShareRef<T>,
    ...definers: Shared.Definer<T, TClass>[]
): ComponentShareDecorator<T, TClass> {

  const shr = share[ComponentShare__symbol]();

  return ComponentProperty(descriptor => {
    ComponentDef.define(
        descriptor.type,
        {
          setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
            setup.perComponent(shr.shareValue(ctx => ctx.component[descriptor.key]));
          },
          define(defContext: DefinitionContext<InstanceType<TClass>>) {
            shr.addSharer(defContext);
          },
        },
        ...definers.map(ext => ext(shr, descriptor)),
    );
  });
}

/**
 * Decorator of component property that {@link ComponentShare shares} a property value.
 *
 * Built by {@link Shared @Shared()} decorator.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 */
export type ComponentShareDecorator<T, TClass extends ComponentClass = Class> =
    ComponentPropertyDecorator<T | EventKeeper<[T] | []>, TClass>;

export namespace Shared {

  /**
   * Component share definer.
   *
   * Definers could be added to {@link Shared @Shared} decorator to extend decorated component definition.
   *
   * @typeParam T - Shared value type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<T, TClass extends ComponentClass = Class> =
  /**
   * @param share - Target share instance.
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component definition to apply to decorated component.
   */
      (
          this: void,
          share: ComponentShare<T>,
          descriptor: ComponentProperty.Descriptor<T | EventKeeper<[T] | []>, TClass>,
      ) => ComponentDef<InstanceType<TClass>>;

}
