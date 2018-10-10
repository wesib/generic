import { ComponentDef, WesFeature } from '@wesib/wesib';
import { ComponentNode } from './component-node';
import { ComponentTree } from './component-tree';
import { ComponentNodeImpl, ComponentTreeImpl, treeAttribute } from './component-tree.impl';

/**
 * Component tree support feature.
 */
@WesFeature({
  prebootstrap: [
    { provide: ComponentTreeImpl, provider: ctx => new ComponentTreeImpl(ctx) },
    { provide: ComponentTree, provider: values => values.get(ComponentTreeImpl).tree },
  ],
  bootstrap(context) {
    context.onDefinition(defContext => {

      const name = ComponentDef.of(defContext.componentType).name;
      let uidSeq = 0;

      defContext.forComponents({ provide: ComponentNodeImpl.uidKey, provider: () => `${name}:${++uidSeq}` });
    });
    context.forComponents({ provide: ComponentNodeImpl, provider: ctx => new ComponentNodeImpl(ctx) });
    context.forComponents({ provide: ComponentNode, provider: ctx => ctx.get(ComponentNodeImpl).node });
    context.onComponent(ctx => {

      const nodeId = ctx.get(ComponentNodeImpl.uidKey);
      const element: HTMLElement = ctx.element;

      element.setAttribute(treeAttribute(ctx), nodeId);
    });
  },
})
export class ComponentTreeSupport {
}
