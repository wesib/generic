/**
 * @module @wesib/generic
 */
import { RoutingStart, RoutingStop } from './routing-stage';

export const RouteParam__symbol = /*#__PURE__*/ Symbol('route-param');

export abstract class RouteParam<T, O> implements RouteParam.Request<T, O> {

  get [RouteParam__symbol](): this {
    return this;
  }

  abstract create(stage: RoutingStart, options: O): RouteParam.Handle<T, O>;

}

export namespace RouteParam {

  export interface Request<T, O> {

    readonly [RouteParam__symbol]: RouteParam<T, O>;

  }

  export interface Handle<T, O> {

    get(): T;

    refine(route: RoutingStart, options: O): void;

    enter?(route: RoutingStop): void;

    abort?(route: RoutingStop): void;

    leave?(): void;

    forget?(): void;

  }

}
