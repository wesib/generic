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
 * Enables default {@link PageLoadAgent page load agents}:
 * 1. Scripts agent.
 *    Includes external scripts from loaded page into main document.
 * 2. Styles agent.
 *    Replaces main document styles with the ones from loaded page. Unless loaded page has no styles.
 * 3. Title agent.
 *    Applies loaded page title to bootstrap window. If there is one.
 */
export class PageLoadSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return PageLoadSupport__feature;
  }

}
