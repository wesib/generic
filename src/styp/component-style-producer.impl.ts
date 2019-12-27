import {
  ArraySet,
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  RenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { EventSupply } from 'fun-events';
import { produceBasicStyle, StypPureSelector, StypRender, StypRules, stypSelector } from 'style-producer';
import { StypSelector } from 'style-producer/d.ts/selector/selector';
import { StypSubSelector } from 'style-producer/d.ts/selector/sub-selector';
import { ComponentStypOptions } from './component-styp-options';
import { ComponentStypRender } from './component-styp-render';
import { ElementIdClass } from './element-id-class.impl';

const ComponentStyleProducer__key =
    (/*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer:impl'));

/**
 * @internal
 */
export class ComponentStyleProducer {

  static get [ContextKey__symbol](): ContextKey<ComponentStyleProducer> {
    return ComponentStyleProducer__key;
  }

  constructor(
      private readonly _context: ComponentContext,
      private readonly _produce = produceBasicStyle,
  ) {}

  produce(rules: StypRules, options: ComponentStypOptions = {}): EventSupply {

    const context = this._context;
    const shadowRoot = context.get(ShadowContentRoot, { or: null });

    return this._produce(rules, {
      ...options,
      document: options.document || context.get(BootstrapWindow).document,
      parent: options.parent || context.contentRoot,
      rootSelector: [],
      schedule: options.schedule || buildScheduler(),
      nsAlias: options.nsAlias || context.get(DefaultNamespaceAliaser),
      render: buildRender(),
    });

    function buildScheduler(): (operation: () => void) => void {

      const scheduler = context.get(RenderScheduler);

      return operation => scheduler.newSchedule().schedule(operation);
    }

    function buildRender(): StypRender | readonly StypRender[] | undefined {

      const { render } = options;
      const renders = new ArraySet<StypRender>(render)
          .add(...context.get(ComponentStypRender));
      const hostSelector =
          options.hostSelector ? stypSelector(options.hostSelector)[0] as StypPureSelector.NormalizedPart : undefined;

      renders.add(shadowRoot
          ? shadowRender(hostSelector)
          : noShadowRender(hostSelector || { c: [context.get(ElementIdClass)] }));

      return renders.value;
    }
  }

}

function shadowRender(hostSelector: StypPureSelector.NormalizedPart | undefined): StypRender {
  return {
    order: -100,
    render(producer, properties) {

      let { selector } = producer;

      if (!selector.length) {
        selector = [hostSelector || { u: [[':', 'host']] }];
      } else if (hostSelector) {

        const [rest, host] = extractHostSelector(selector);

        if (host) {
          if (host.length) {
            selector = [{ u: [[':', 'host', extendHostSelector(host, hostSelector)]] }, ...rest];
          } else {
            selector = [{ u: [[':', 'host', [hostSelector]]] }, ...rest];
          }
        }
      }

      producer.render(properties, { selector });
    },
  };
}

function noShadowRender(hostSelector: StypPureSelector.NormalizedPart): StypRender {
  return {
    order: -100,
    render(producer, properties) {

      let { selector } = producer;

      if (!selector.length) {
        selector = [hostSelector];
      } else {

        const [rest, host] = extractHostSelector(selector);

        if (host && host.length) {
          selector = [...extendHostSelector(host, hostSelector), ...rest];
        } else {
          selector = [hostSelector, ...rest];
        }
      }

      producer.render(properties, { selector });
    },
  };
}

function extractHostSelector(
    selector: StypSelector.Normalized,
): [StypSelector.Normalized, StypSelector.Normalized?] {
  if (typeof selector[0] !== 'string') {

    const [{ ns, e, i, c, u, s, $ }, ...restParts] = selector;

    if (!ns && !e && !i && !c && !s && u) {

      const [[prefix, name, ...params]] = u;

      if (prefix === ':' && name === 'host') {

        let host: StypSelector.Mutable;

        if (params.length) {
          host = [ ...params[0] as StypSubSelector.NormalizedParameter ];
          (host[0] as any).$ = $;
        } else {
          host = $ ? [{ $ }] : [];
        }

        return [restParts, host];
      }
    }
  }
  return [selector];
}

function extendHostSelector(
    selector: StypSelector.Normalized,
    {
      ns,
      e,
      i,
      c,
      u,
      s,
    }: StypPureSelector.NormalizedPart,
): StypSelector.Normalized {

  const [first, ...rest] = selector as [StypSelector.NormalizedPart, ...StypSelector.Normalized];

  return [
    {
      ns: first.e || first.ns ? first.ns : ns,
      e: first.e || first.ns ? first.e : e,
      i: first.i || i,
      c: first.c ? (c ? [...first.c, ...c] : first.c) as typeof c : c,
      u: first.u ? (u ? [...first.u, ...u] : first.u) as typeof u : u,
      s: ((first.s || '') + (s || '')) || undefined,
      $: first.$,
    },
    ...rest,
  ];
}
