/**
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, AfterEvent__symbol, EventKeeper, EventSender, OnEvent, OnEvent__symbol } from 'fun-events';
import { Route } from './route';
import { RoutingStage } from './routing-stage';

const Router__key = /*#__PURE__*/ new SingleContextKey<Router>('router');

export abstract class Router implements EventKeeper<[Route]>, EventSender<[RoutingStage]> {

  static get [ContextKey__symbol](): ContextKey<Router> {
    return Router__key;
  }

  abstract readonly read: AfterEvent<[Route]>;

  abstract readonly on: OnEvent<[RoutingStage]>;

  get [AfterEvent__symbol](): AfterEvent<[Route]> {
    return this.read;
  }

  get [OnEvent__symbol](): OnEvent<[RoutingStage]> {
    return this.on;
  }

}
