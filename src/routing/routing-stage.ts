/**
 * @module @wesib/generic
 */
import { Route } from './route';
import { RouteParam } from './route-param';

export type RoutingStage = RoutingStart | RoutingStop;

export interface RoutingStart {

  readonly action: 'pre-navigate' | 'pre-replace';

  readonly from: Route;

  readonly to: Route;

  param<T, O>(request: RouteParam.Request<T, O>, options: O): T;

  abort(): void;

}

export interface RoutingStop {

  readonly action: 'navigate' | 'replace' | 'return' | 'abort';

  readonly to: Route;

}
