/**
 * @module @wesib/generic
 */
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { Router } from './router';
import { Router as Router_ } from './router.impl';

const RoutingSupport__feature: FeatureDef = {
  set: { a: Router, as: Router_ },
};

export class RoutingSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return RoutingSupport__feature;
  }

}
