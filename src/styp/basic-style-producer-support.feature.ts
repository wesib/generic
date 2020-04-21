/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { produceBasicStyle } from '@proc7ts/style-producer';
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStypFormat } from './component-styp-format';
import { ComponentStypObjectFormat } from './component-styp-object.format';

/**
 * @internal
 */
const BasicStyleProducerSupport__feature: FeatureDef = {
  setup(setup) {
    setup.perComponent({ a: ComponentStyleProducer, is: produceBasicStyle });
    setup.perComponent({
      a: ComponentStypFormat,
      as: ComponentStypObjectFormat,
    });
  },
};

/**
 * Basic style producer support feature.
 *
 * Depends on [style-producer].
 *
 * Unlike [[StyleProducerSupport]] feature this one does not enable default CSS renderers.
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
