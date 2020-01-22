/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { Navigation } from './navigation';
import { createNavigation } from './navigation.impl';

/**
 * @internal
 */
const NavigationSupport__feature: FeatureDef = {
  setup(setup) {
    setup.provide({ a: Navigation, by: createNavigation });
  },
};

/**
 * Browser navigation support feature.
 *
 * Makes [[Navigation]] available in bootstrap context.
 */
export class NavigationSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return NavigationSupport__feature;
  }

}
