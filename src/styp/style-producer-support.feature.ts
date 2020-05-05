/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { produceStyle } from '@proc7ts/style-producer';
import { FeatureDef, FeatureDef__symbol, StateSupport } from '@wesib/wesib';
import { BasicStyleProducerSupport } from './basic-style-producer-support.feature';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStypFormat } from './component-styp-format';
import { ComponentStypObjectFormat } from './component-styp-object.format';

/**
 * @internal
 */
const StyleProducerSupport__feature: FeatureDef = {
  has: BasicStyleProducerSupport,
  needs: StateSupport,
  setup(setup) {
    setup.provide({ a: ComponentStyleProducer, is: produceStyle });
    setup.perComponent({
      a: ComponentStypFormat,
      as: ComponentStypObjectFormat,
    });
  },
};

/**
 * Style producer support feature.
 *
 * Depends on [style-producer].
 *
 * This is an implementation of [[BasicStyleProducerSupport]] feature that enables default CSS renderers.
 *
 * It is _not_ enabled automatically by {@link ProduceStyle @ProduceStyle} decorator.
 *
 * [style-producer]: https://www.npmjs.com/package/style-producer
 */
export class StyleProducerSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return StyleProducerSupport__feature;
  }

}
