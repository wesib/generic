/**
 * @module @wesib/generic
 */
import { ElementEnhancer, FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { NavigationSupport } from '../navigation-support.feature';
import { toNavigationLink } from './to-navigation-link.impl';

const NavigationLinksSupport__feature: FeatureDef = {
  needs: NavigationSupport,
  set: { a: ElementEnhancer, by: toNavigationLink },
};

/**
 * Enables navigation links support.
 *
 * Makes elements (e.e anchor tags like `<a href="/some/url">`) within bootstrap root navigate using
 * {@link Navigation navigation service}. This is implemented by `ElementEnhancer`, so either target element
 * should be processed manually (i.e. using `ElementAdapter`), or some automatic detection should be enabled
 * (e.g. `AutoConnectSupport` feature).
 *
 * The URL to navigate to can be placed `href`, `b-href`, or `data-b-href` attribute.
 *
 * The following {@link elementBehaviors element behaviors} recognized:
 * - `-`, `-navigation-link` - Makes target element act as raw HTML element. I.e. it won't be enhanced.
 * - `navigation-link:replace` - Makes target element {@link Navigation.replace replace target page} on click.
 * - `navigation-link:back` - Makes target element {@link Navigation.back navigate back to previous page} on click.
 * - `navigation-link:forward` - Makes target element {@link Navigation.forward navigate forward to next page} on click.
 * - `navigation-link` - Makes target element {@link Navigation.open open target page} on click.
 * - `*` - decide automatically whether to enhance element.
 *   In this case only element with `href`, `b-href`, or `data-b-href` attribute will be enhanced with
 *   `navigation-link` behavior.
 */
export class NavigationLinksSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return NavigationLinksSupport__feature;
  }

}
