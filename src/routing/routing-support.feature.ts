/**
 * @module @wesib/generic
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { NavigationAgent, NavigationSupport } from '../navigation';
import { Router } from './router';
import { Router as Router_ } from './router.impl';
import { RoutingHistory, routingHistoryAgent } from './routing-history.impl';

const RoutingSupport__feature: FeatureDef = {
  needs: NavigationSupport,
  set: [
    { a: Router, as: Router_ },
    { a: NavigationAgent, by: routingHistoryAgent, with: [RoutingHistory] },
  ],
};

export class RoutingSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return RoutingSupport__feature;
  }

}
