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

export function Shared<T, TClass extends ComponentClass = Class>(
    share: ComponentShare<T>,
): ComponentPropertyDecorator<T | EventKeeper<[] | [T]>, TClass> {
  return ComponentProperty(descriptor => {
    ComponentDef.define(
        descriptor.type,
        {
          setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
            share.provideValue(setup, ctx => ctx.component[descriptor.key]);
          },
          define(defContext: DefinitionContext<InstanceType<TClass>>) {
            share.shareBy(defContext);
          },
        },
    );
  });
}
