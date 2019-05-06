import {
  ArraySet,
  BootstrapWindow,
  ComponentContext,
  ContentRoot,
  RenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventInterest } from 'fun-events';
import { produceBasicStyle, StypOptions, StypRender, StypRules, StypSelector } from 'style-producer';
import { DefaultNamespaceAliaser } from './default-namespace-aliaser';
import { ElementIdClass } from './element-id-class';

const ComponentStyleProducer__key =
    /*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer:impl');

const hostSelector: StypSelector.Normalized = [{ e: ':host' }];

/**
 * @internal
 */
export class ComponentStyleProducer {

  static get key(): ContextKey<ComponentStyleProducer> {
    return ComponentStyleProducer__key;
  }

  constructor(
      private readonly _context: ComponentContext,
      private readonly _produce = produceBasicStyle) {
  }

  produce(rules: StypRules, options: StypOptions = {}): EventInterest {

    const context = this._context;
    const shadowRoot = context.get(ShadowContentRoot, { or: null });

    return this._produce(rules, {
      ...options,
      document: options.document || context.get(BootstrapWindow).document,
      parent: options.parent || context.get(ContentRoot),
      rootSelector: options.rootSelector || buildRootSelector(),
      schedule: options.schedule || buildScheduler(),
      nsAlias: options.nsAlias || context.get(DefaultNamespaceAliaser),
      render: buildRender(),
    });

    function buildScheduler(): (operation: () => void) => void {

      const scheduler = context.get(RenderScheduler);

      return operation => scheduler.newSchedule().schedule(operation);
    }

    function buildRootSelector(): StypSelector {
      return shadowRoot ? hostSelector : [];
    }

    function buildRender(): StypRender | readonly StypRender[] | undefined {

      const { render } = options;

      if (shadowRoot) {
        return render;
      }

      return new ArraySet<StypRender>(render)
          .add(noShadowRender(context.get(ElementIdClass)))
          .value;
    }
  }

}

function noShadowRender(idClass: ElementIdClass): StypRender {
  return {
    order: -100,
    render(producer, properties) {
      producer.render(properties, {
        selector: [{ c: [idClass] }, ...producer.selector],
      });
    },
  };
}
