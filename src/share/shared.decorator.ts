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
import { ComponentShare__symbol, ComponentShareRef } from './component-share';

/**
 * Builds a component property decorator that {@link ComponentShare shares} a property value.
 *
 * The decorated property should return either a static value, or its `EventKeeper` if the case the value is updatable.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Target share reference.
 *
 * @returns Component property decorator.
 */
export function Shared<T, TClass extends ComponentClass = Class>(
    share: ComponentShareRef<T>,
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
