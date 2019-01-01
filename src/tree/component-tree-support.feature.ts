import { Feature, StateSupport } from '@wesib/wesib';
import { AttributesObserver } from './attributes-observer';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instances for each component.
 */
@Feature({
  need: StateSupport,
  forComponents: [
    { as: AttributesObserver },
    { as: ComponentNodeImpl },
    {
      a: ComponentNode,
      by(impl: ComponentNodeImpl): ComponentNode {
        return impl.node;
      },
      with: [ComponentNodeImpl],
    },
  ],
})
export class ComponentTreeSupport {}
