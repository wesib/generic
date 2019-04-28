import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { newNamespaceAliaser } from 'style-producer';
import { BootstrapNamespaceAliaser } from './bootstrap-namespace-aliaser';
import { ComponentStyleProducer } from './component-style-producer.impl';
import { ProduceComponentStyle } from './produce-component-style';

const StyleProducerSupport__feature: FeatureDef = {
  set: {
    a: BootstrapNamespaceAliaser,
    by: newNamespaceAliaser,
  },
  perComponent: [
    {
      as: ComponentStyleProducer,
    },
    {
      a: ProduceComponentStyle,
      by(producer: ComponentStyleProducer): ProduceComponentStyle {
        return (rules, opts) => producer.produce(rules, opts);
      },
      with: [ComponentStyleProducer],
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
