/**
 * @module @wesib/generic
 */
import { ComponentContext, FeatureDef, FeatureDef__symbol, RenderSupport } from '@wesib/wesib';
import { produceStyle } from 'style-producer';
import { BasicStyleProducerSupport } from './basic-style-producer-support.feature';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStyleProducer as ComponentStyleProducer_ } from './component-style-producer.impl';

const StyleProducerSupport__feature: FeatureDef = {
  has: BasicStyleProducerSupport,
  needs: RenderSupport,
  setup(setup) {
    setup.perComponent({
      a: ComponentStyleProducer_,
      by(context: ComponentContext) {
        return new ComponentStyleProducer_(context, produceStyle);
      },
    });
    setup.perComponent({
      a: ComponentStyleProducer,
      by(producer: ComponentStyleProducer_): ComponentStyleProducer {
        return (rules, opts) => producer.produce(rules, opts);
      },
      with: [ComponentStyleProducer_],
    });
  },
};

/**
 * Style producer support feature.
 *
 * Depends on [style-producer].
 *
 * This is an implementation of [[BasicStyleProducerSupport]] feature that enables default CSS renders.
 *
 * It is _not_ enabled automatically by {@link ProduceStyle @ProduceStyle} decorator.
 *
 * [style-producer]: https://www.npmjs.com/package/style-producer
 */
export class StyleProducerSupport {

  static get [FeatureDef__symbol]() {
    return StyleProducerSupport__feature;
  }

}
