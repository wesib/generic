import { BootstrapContext, ComponentContext, FeatureDef, FeatureDef__symbol, StateSupport } from '@wesib/wesib';
import { ComponentNode } from './element-node';
import { elementNodeOf } from './element-node.impl';

const DEF: FeatureDef = {
  need: StateSupport,
  forComponents: [
    {
      a: ComponentNode,
      by(context: ComponentContext) {
        return elementNodeOf(context.get(BootstrapContext), context.element) as ComponentNode;
      },
    },
  ],
};

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instance for each component.
 */
export class ComponentTreeSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return DEF;
  }

}
