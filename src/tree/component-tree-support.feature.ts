import { BootstrapContext, ComponentContext, FeatureDef, featureDefSymbol, StateSupport } from '@wesib/wesib';
import { AttributesObserver } from './attributes-observer';
import { ComponentNode } from './element-node';
import { elementNodeOf } from './element-node.impl';

const DEF: FeatureDef = {
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
};

/**
 * Component tree support feature.
 *
 * Provides a `ComponentNode` instances for each component.
 */
export class ComponentTreeSupport {

  static get [featureDefSymbol](): FeatureDef {
    return DEF;
  }

}
