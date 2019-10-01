/**
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, AfterEvent__symbol, EventKeeper } from 'fun-events';
import { Route } from './route';

const Router__key = new SingleContextKey<Router>('router');

export abstract class Router implements EventKeeper<[Route]> {

  static get [ContextKey__symbol](): ContextKey<Router> {
    return Router__key;
  }

  abstract readonly read: AfterEvent<[Route]>;

  get [AfterEvent__symbol](): AfterEvent<[Route]> {
    return this.read;
  }

  abstract readonly readActive: AfterEvent<[Route.Active]>;

}
