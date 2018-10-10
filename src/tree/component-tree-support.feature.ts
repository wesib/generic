import { WesFeature } from '@wesib/wesib';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instances for each component.
 */
@WesFeature({
  bootstrap(context) {
    context.forComponents({ provide: ComponentNodeImpl, provider: ctx => new ComponentNodeImpl(ctx) });
    context.forComponents({ provide: ComponentNode, provider: ctx => ctx.get(ComponentNodeImpl).node });
  },
})
export class ComponentTreeSupport {
}
