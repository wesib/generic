/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { Theme } from './theme';
import { ThemeFactory } from './theme-factory';
import { ThemeFactory$ } from './theme-factory.impl';
import { ThemeStyle } from './theme-style';

/**
 * @internal
 */
const ThemeSupport__feature: FeatureDef = {
  setup(setup) {
    setup.provide({ a: ThemeFactory, as: ThemeFactory$, with: [ThemeStyle] });
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
 *
 * Depends on [@proc7ts/style-producer].
 *
 * [@proc7ts/style-producer]: https://www.npmjs.com/package/@proc7ts/style-producer
 */
export class ThemeSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return ThemeSupport__feature;
  }

}
