/**
 * @module @wesib/generic
 */
import { Route } from './route';

export type RouteAction = RouteRequest | RouteUpdate;

export interface RouteRequest {
  readonly type: 'pre-navigate' | 'pre-replace';
  readonly from: Route;
  readonly to: Route;
  abort(): void;
}

export interface RouteUpdate {
  readonly type: 'navigate' | 'replace' | 'return' | 'abort';
  readonly to: Route;
}
