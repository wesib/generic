import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { newNamespaceAliaser } from 'style-producer';
import { BootstrapNamespaceAliaser } from './bootstrap-namespace-aliaser';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStyleProducer as ComponentStyleProducer_ } from './component-style-producer.impl';

const StyleProducerSupport__feature: FeatureDef = {
  set: {
    a: BootstrapNamespaceAliaser,
    by: newNamespaceAliaser,
  },
  perComponent: [
    {
      as: ComponentStyleProducer_,
    },
    {
      a: ComponentStyleProducer,
      by(producer: ComponentStyleProducer_): ComponentStyleProducer {
        return (rules, opts) => producer.produce(rules, opts);
      },
      with: [ComponentStyleProducer_],
    },
  ],
};

/**
 * Style producer support feature.
 *
 * Depends on [style-producer].
 *
 * [style-producer]: https://www.npmjs.com/package/style-producer
 */
export class StyleProducerSupport {

  static get [FeatureDef__symbol]() {
    return StyleProducerSupport__feature;
  }

}
