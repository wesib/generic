/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { valueProvider } from '@proc7ts/call-thru';
import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import { EventSupply, eventSupply, eventSupplyOf } from '@proc7ts/fun-events';
import { NamespaceAliaser } from '@proc7ts/namespace-aliaser';
import { RenderScheduler } from '@proc7ts/render-scheduler';
import {
  lazyStypRules,
  StypFormat,
  StypFormatConfig,
  StypPureSelector,
  StypRenderer,
  StypRules,
  StypSelector,
  stypSelector,
  StypSubSelector,
} from '@proc7ts/style-producer';
import { ArraySet, ComponentContext, ShadowContentRoot } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStypRenderer } from './component-styp-renderer';
import { ElementIdClass } from './element-id-class.impl';

/**
 * Configuration of {@link ComponentStypFormat component style production format}.
 */
export interface ComponentStypFormatConfig extends StypFormatConfig {

  /**
   * Structured CSS selector to use for custom element's host.
   *
   * It modifies the selectors of produced CSS rules.
   *
   * For custom element with shadow root:
   * - Replaces root CSS rule selector with `:host(<hostSelector>).
   * - When `hostSelector` is omitted, then replaces root CSS rule selector with `:host`.
   * - If CSS rule selector starts with `:host`, then replaces `:host` with `:host(<hostSelector>)`
   * - If CSS rule selector starts with `:host(<selector>)`, then extends `<selector>` by `hostSelector`.
   *   I.e. appends CSS classes and sub-selectors to it, and fulfills missing element and identifier selectors.
   *
   * For custom element without shadow root either uses provided `hostSelector`, or generates a unique one when omitted.
   * And additionally:
   * - Replaces root CSS rule selector it with `hostSelector`.
   * - If CSS rule selector starts with `:host`, then replaces `:host` with `hostSelector`.
   * - If CSS rule selector starts with `:host(<selector>), then replaces `:host(<selector>)` with `<selector>` extended
   *   by `hostSelector`. I.e. appends CSS classes and sub-selectors to it, and fulfills missing element and identifier
   *   selectors.
   * - Otherwise prepends CSS rule selector with `hostSelector`.
   *
   * This selector should not contain a `:host` sub-selector.
   */
  readonly hostSelector?: StypPureSelector.Part | string;

  /**
   * Root CSS selector is never used for custom elements. A `hostSelector` is applied instead.
   */
  readonly rootSelector?: undefined;

  /**
   * DOM rendering operations scheduler.
   *
   * Creates a render schedule per rule.
   *
   * `DefaultRenderScheduler` is used when omitted.
   */
  readonly scheduler?: RenderScheduler;

  /**
   * Namespace aliaser to use.
   *
   * `DefaultNamespaceAliaser` is used when omitted.
   */
  readonly nsAlias?: NamespaceAliaser;

}

const ComponentStypFormat__symbol = (
    /*#__PURE__*/ new SingleContextKey<ComponentStypFormat>(
        'component-styp-format',
    )
);

/**
 * Component style production format.
 *
 * This format can be obtained from component context.
 *
 * The formats implemented:
 * - {@link ComponentStypObjectFormat} (the default) renders CSS using CSS object model.
 * - {@link ComponentStypDomFormat} renders CSS as text. May render CSS of disconnected element.
 */
export abstract class ComponentStypFormat {

  /**
   * A key of component context value containing its style production format.
   */
  static get [ContextKey__symbol](): ContextKey<ComponentStypFormat> {
    return ComponentStypFormat__symbol;
  }

  /**
   * Component context.
   */
  abstract readonly context: ComponentContext;

  /**
   * Produces and dynamically updates component's CSS stylesheets based on the given CSS rules.
   *
   * Utilizes {@link newProducer component's producer function}.
   *
   * @param rules  A source of CSS rules to produce stylesheets for.
   * @param config  Style production format configuration.
   *
   * @returns CSS rules supply. Once cut off the produced stylesheets are removed.
   */
  produce(
      rules: StypRules.Source,
      config?: ComponentStypFormatConfig,
  ): EventSupply {

    const producer = this.newProducer(rules, config);
    const supply = eventSupply();

    this.context.whenConnected(() => {
      producer().needs(supply).cuts(supply);
    });

    return supply;
  }

  /**
   * Creates component's CSS stylesheets producer based on the given CSS rules.
   *
   * Utilizes {@link ComponentStyleProducer}.
   *
   * @param rules  A source of CSS rules to produce stylesheets for.
   * @param config  Style production format configuration.
   *
   * @returns CSS rules producer function returning CSS rules supply. Once cut off the produced stylesheets are removed.
   */
  newProducer(
      rules: StypRules.Source,
      config?: ComponentStypFormatConfig,
  ): (this: void) => EventSupply {

    const css = lazyStypRules(rules);
    let producer: () => EventSupply;
    const componentSupply = eventSupplyOf(this.context);

    producer = () => {

      const produceStyle = this.context.get(ComponentStyleProducer);

      return produceStyle(css, this.format(config)).needs(componentSupply);
    };

    // In case the component destroyed already, the producer will be reassigned here _before_ return.
    componentSupply.whenOff(() => {
      // Prevent style production once component destroyed.
      producer = valueProvider(componentSupply);
    });

    return () => producer();
  }

  /**
   * Builds CSS style production format to by its config.
   *
   * This method is called by {@link produce} one.
   *
   * @param config  Component style production format configuration.
   *
   * @returns Component style production format.
   */
  abstract format(config?: ComponentStypFormatConfig): StypFormat;

  /**
   * Builds component-specific style renderer.
   *
   * This renderer applies {@link ComponentStypFormatConfig.hostSelector host selector} to generated CSS rules.
   *
   * This method is called by {@link format} one.
   *
   * @param config  Component style production format configuration.
   *
   * @returns Component style renderer(s).
   */
  renderer(
      config: ComponentStypFormatConfig,
  ): StypRenderer | readonly StypRenderer[] | undefined {

    const shadowRoot = this.context.get(ShadowContentRoot, { or: null });
    const { renderer } = config;
    const renderers = new ArraySet<StypRenderer>(renderer)
        .add(...this.context.get(ComponentStypRenderer));
    const hostSelector = config.hostSelector
        ? stypSelector(config.hostSelector)[0] as StypPureSelector.NormalizedPart
        : undefined;

    renderers.add(shadowRoot
        ? shadowRenderer(hostSelector)
        : noShadowRenderer(hostSelector || { c: [this.context.get(ElementIdClass)] }));

    return renderers.value;
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

