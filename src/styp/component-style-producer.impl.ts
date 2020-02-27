import {
  ArraySet,
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  DefaultRenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { EventSupply } from 'fun-events';
import {
  produceBasicStyle,
  StypPureSelector,
  StypRenderer,
  StypRules,
  stypSelector,
  StypSelector,
  StypSubSelector,
} from 'style-producer';
import { ComponentStypOptions } from './component-styp-options';
import { ComponentStypRenderer } from './component-styp-renderer';
import { ElementIdClass } from './element-id-class.impl';

/**
 * @internal
 */
const ComponentStyleProducer__key = (
    /*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer:impl')
);

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
      scheduler: options.scheduler || context.get(DefaultRenderScheduler),
      nsAlias: options.nsAlias || context.get(DefaultNamespaceAliaser),
      renderer: buildRenderer(),
    });

    function buildRenderer(): StypRenderer | readonly StypRenderer[] | undefined {

      const { renderer } = options;
      const renderers = new ArraySet<StypRenderer>(renderer)
          .add(...context.get(ComponentStypRenderer));
      const hostSelector = options.hostSelector
          ? stypSelector(options.hostSelector)[0] as StypPureSelector.NormalizedPart
          : undefined;

      renderers.add(shadowRoot
          ? shadowRenderer(hostSelector)
          : noShadowRenderer(hostSelector || { c: [context.get(ElementIdClass)] }));

      return renderers.value;
    }
  }

}

/**
 * @internal
 */
function shadowRenderer(hostSelector: StypPureSelector.NormalizedPart | undefined): StypRenderer {
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

/**
 * @internal
 */
function noShadowRenderer(hostSelector: StypPureSelector.NormalizedPart): StypRenderer {
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

/**
 * @internal
 */
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
          host = Array.from(params[0] as StypSubSelector.NormalizedParameter);
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

/**
 * @internal
 */
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
