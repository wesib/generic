/**
 * @module @wesib/generic
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { BasicStyleProducerSupport } from '../styp';
import { Theme } from './theme';
import { ThemeFactory } from './theme-factory';
import { ThemeFactory as ThemeFactory_ } from './theme-factory.impl';
import { ThemeStyle } from './theme-style';

/**
 * @internal
 */
const ThemeSupport__feature: FeatureDef = {
  needs: BasicStyleProducerSupport,
  setup(setup) {
    setup.provide({ a: ThemeFactory, as: ThemeFactory_, with: [ThemeStyle] });
    setup.provide({
      a: Theme,
      by(factory: ThemeFactory) {
        return factory.newTheme();
      },
      with: [ThemeFactory],
    });
  },
};

/**
 * Theme support feature.
 *
 * This needs to be enabled in order [[Theme]] and [[ThemeFactory]] to be available.
 */
export class ThemeSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return ThemeSupport__feature;
  }

}
