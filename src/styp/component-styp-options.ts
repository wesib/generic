/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { noop } from 'call-thru';
import { eventSupply, EventSupply, noEventSupply } from 'fun-events';
import { lazyStypRules, StypOptions, StypRules } from 'style-producer';
import { ComponentStyleProducer } from './component-style-producer';

/**
 * Component CSS styles production options.
 */
export interface ComponentStypOptions extends StypOptions {

  /**
   * Whether to produce CSS stylesheets while component is not connected.
   *
   * Can be one of:
   * - `true` - to produce stylesheets when first connected and update them even if component is disconnected after
   *   that. This is the default, as stylesheet updates is expected to be rare operation.
   * - `false` - to produce stylesheet whenever component is connected and remove them once disconnected.
   *   This is a good choice if stylesheets are small and updated frequently.
   * - `always` - to produce stylesheets immediately upon component readiness and update them offline after that.
   *   This is the right choice if component needs a stylesheet ready before it is added to the document.
   */
  offline?: boolean | 'always';

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
    const offline = options && options.offline;
    const produceStyle = context.get(ComponentStyleProducer);

    let cssSupply = noEventSupply();
    let doProduceStyle: () => void;
    const supply = eventSupply(reason => {
      doProduceStyle = noop;
      cssSupply.off(reason);
    });

    doProduceStyle = () => {
      cssSupply = produceStyle(css, options).needs(supply);
    };

    switch (offline) {
    case 'always':
      context.whenReady(doProduceStyle);
      break;
    case false:
      context.whenOn(doProduceStyle);
      context.whenOff(() => cssSupply.off());
      break;
    default:
      context.whenOn.once(doProduceStyle);
    }

    context.whenDestroyed(reason => supply.off(reason));

    return supply;
  },
};
