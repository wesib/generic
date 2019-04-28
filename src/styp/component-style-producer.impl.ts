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
import { produceStyle, StypOptions, StypRender, StypRules, StypSelector } from 'style-producer';
import { BootstrapNamespaceAliaser } from './bootstrap-namespace-aliaser';
import { ElementIdClass } from './element-id-class';

const ComponentStyleProducer__key =
    /*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer');

const hostSelector: StypSelector.Normalized = [{ e: ':host' }];

/**
 * @internal
 */
export class ComponentStyleProducer {

  static get key(): ContextKey<ComponentStyleProducer> {
    return ComponentStyleProducer__key;
  }

  constructor(private readonly _context: ComponentContext) {
  }

  produce(rules: StypRules, opts: StypOptions = {}): EventInterest {

    const context = this._context;
    const shadowRoot = context.get(ShadowContentRoot, { or: null });

    return produceStyle(rules, {
      ...opts,
      document: opts.document || context.get(BootstrapWindow).document,
      parent: opts.parent || context.get(ContentRoot),
      rootSelector: opts.rootSelector || buildRootSelector(),
      schedule: opts.schedule || buildScheduler(),
      nsAlias: opts.nsAlias || context.get(BootstrapNamespaceAliaser),
      render: buildRender(),
    });

    function buildScheduler(): (operation: () => void) => void {

      const scheduler = context.get(RenderScheduler);

      return operation => scheduler.scheduleRender(operation);
    }

    function buildRootSelector(): StypSelector {
      return shadowRoot ? hostSelector : [];
    }

    function buildRender(): StypRender | readonly StypRender[] | undefined {

      const { render } = opts;

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
