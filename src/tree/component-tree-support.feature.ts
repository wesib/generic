/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { BootstrapContext, ComponentContext, FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { ComponentNode } from './element-node';
import { elementNodeOf } from './element-node.impl';

/**
 * @internal
 */
const ComponentTreeSupport__feature: FeatureDef = {
  setup(setup) {
    setup.perComponent({
      a: ComponentNode,
      by(context: ComponentContext) {
        return elementNodeOf(context.get(BootstrapContext), context.element) as ComponentNode;
      },
    });
  },
};

/**
 * Component tree support feature.
 *
 * Provides a [[ComponentNode]] instance for each component.
 */
export class ComponentTreeSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return ComponentTreeSupport__feature;
  }

}
