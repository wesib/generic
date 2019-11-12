/**
 * @module @wesib/generic
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { NavigationSupport } from '../navigation-support.feature';
import { PageLoadAgent } from './page-load-agent';
import { pageScriptsAgent } from './page-scripts-agent.impl';

const PageLoadSupport__feature: FeatureDef = {
  needs: NavigationSupport,
  set: [
    { a: PageLoadAgent, by: pageScriptsAgent },
  ]
};

/**
 * Page load support feature.
 *
 * Enables default {@link PageLoadAgent page load agents} that:
 * - include scripts from loaded page into main document,
 * - include styles from loaded page into main document,
 * - apply loaded page title to bootstrap window.
 */
export class PageLoadSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return PageLoadSupport__feature;
  }

}
