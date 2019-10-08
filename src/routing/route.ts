/**
 * @module @wesib/generic
 */
import { RouteParam } from './route-param';

export interface Route {

  readonly url: URL;

  readonly data: any;

  param<T>(request: RouteParam.Request<T, unknown>): T | undefined;

}
