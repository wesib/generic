/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStyleProducer as ComponentStyleProducer_ } from './component-style-producer.impl';

/**
 * @internal
 */
const BasicStyleProducerSupport__feature: FeatureDef = {
  setup(setup) {
    setup.perComponent({ as: ComponentStyleProducer_ });
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
 * Basic style producer support feature.
 *
 * Depends on [style-producer].
 *
 * Unlike [[StyleProducerSupport]] feature this one does not enable default CSS renders.
 *
 * It is enabled automatically by {@link ProduceStyle @ProduceStyle} decorator.
 *
 * [style-producer]: https://www.npmjs.com/package/style-producer
 */
export class BasicStyleProducerSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return BasicStyleProducerSupport__feature;
  }

}
