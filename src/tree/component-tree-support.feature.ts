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
    context.forComponents({ a: ComponentNodeImpl, by: ctx => new ComponentNodeImpl(ctx) });
    context.forComponents({ a: ComponentNode, by: ctx => ctx.get(ComponentNodeImpl).node });
  },
})
export class ComponentTreeSupport {
}
