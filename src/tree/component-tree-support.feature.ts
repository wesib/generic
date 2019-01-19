import { BootstrapContext, ComponentContext, Feature, StateSupport } from '@wesib/wesib';
import { AttributesObserver } from './attributes-observer';
import { ComponentNode } from './element-node';
import { elementNodeOf } from './element-node.impl';

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instances for each component.
 */
@Feature({
  need: StateSupport,
  set: { as: AttributesObserver },
  forComponents: [
    {
      a: ComponentNode,
      by(context: ComponentContext) {
        return elementNodeOf(context.get(BootstrapContext), context.element) as ComponentNode;
      },
    },
  ],
})
export class ComponentTreeSupport {}
