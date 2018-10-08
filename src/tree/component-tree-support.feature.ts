import { WesFeature } from '@wesib/wesib';
import { ComponentNode } from './component-node';
import { ComponentTree } from './component-tree';
import { ComponentNodeImpl, ComponentTreeImpl } from './component-tree.impl';

/**
 * Component tree support feature.
 */
@WesFeature({
  prebootstrap: [
    { key: ComponentTreeImpl.key, provider: ctx => new ComponentTreeImpl(ctx) },
    { key: ComponentTree.key, provider: values => values.get(ComponentTreeImpl.key).tree },
  ],
  bootstrap(context) {
    context.forComponents(ComponentNodeImpl.key, ctx => new ComponentNodeImpl(ctx));
    context.forComponents(ComponentNode.key, ctx => ctx.get(ComponentNodeImpl.key).node);
  },
})
export class ComponentTreeSupport {
}
