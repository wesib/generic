import { produceStyle } from '@frontmeans/style-producer';
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';

/**
 * @internal
 */
const StyleProducerSupport__feature: FeatureDef = {
  setup(setup) {
    setup.provide({ a: ComponentStyleProducer, is: produceStyle });
  },
};

/**
 * Style producer support feature.
 *
 * This feature enables default CSS renderers.
 *
 * It is _not_ enabled automatically by {@link ProduceStyle @ProduceStyle} decorator.
 *
 * Depends on [@frontmeans/style-producer].
 *
 * [@frontmeans/style-producer]: https://www.npmjs.com/package/@frontmeans/style-producer
 */
export class StyleProducerSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return StyleProducerSupport__feature;
  }

}
