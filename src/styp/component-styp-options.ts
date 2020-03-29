/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { noop } from '@proc7ts/call-thru';
import { eventSupply, EventSupply, noEventSupply } from '@proc7ts/fun-events';
import { lazyStypRules, StypOptions, StypPureSelector, StypRules } from '@proc7ts/style-producer';
import { ComponentContext } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';

/**
 * Component CSS styles production options.
 */
export interface ComponentStypOptions extends StypOptions {

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
  hostSelector?: StypPureSelector.Part | string;

  /**
   * Root CSS selector is never used for custom elements. A `hostSelector` is applied instead.
   */
  rootSelector?: undefined;

  /**
   * Whether to produce CSS stylesheets while component is not connected.
   *
   * Can be one of:
   * - `true` - to produce stylesheets immediately upon component readiness and update after that. This is the default,
   *   as stylesheet updates is expected to be rare operation.
   * - `false` - to produce stylesheet whenever component is connected and remove them once disconnected.
   *   This is a good choice if stylesheets are small and updated frequently.
   */
  offline?: boolean;

}

export const ComponentStypOptions = {

  /**
   * Produces and dynamically updates component's CSS stylesheets based on the given CSS rules.
   *
   * @param context  Target component context.
   * @param rules  A source of CSS rules to produce stylesheets for.
   * @param options  Production options.
   *
   * @returns CSS rules supply. Once cut off the produced stylesheets are removed.
   */
  produce(
      context: ComponentContext,
      rules: StypRules.Source,
      options?: ComponentStypOptions,
  ): EventSupply {

    const css = lazyStypRules(rules);
    const { offline = true } = options || {};
    const produceStyle = context.get(ComponentStyleProducer);

    let cssSupply = noEventSupply();
    let doProduceStyle: () => void;
    const supply = eventSupply(() => {
      doProduceStyle = noop;
    }).needs(context).cuts(cssSupply);

    doProduceStyle = () => {
      cssSupply = produceStyle(css, options).needs(supply);
    };

    if (offline) {
      context.whenReady(doProduceStyle);
    } else {
      context.whenConnected(doProduceStyle);
    }

    return supply;
  },

};
