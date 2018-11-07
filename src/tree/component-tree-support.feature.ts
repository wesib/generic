import { Feature } from '@wesib/wesib';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instances for each component.
 */
@Feature({
  bootstrap(context) {
    context.forComponents({ as: ComponentNodeImpl });
    context.forComponents({
      a: ComponentNode,
      by(impl: ComponentNodeImpl): ComponentNode {
        return impl.node;
      },
      with: [ComponentNodeImpl],
    });
  },
})
export class ComponentTreeSupport {
}
