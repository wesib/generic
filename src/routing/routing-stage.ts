/**
 * @module @wesib/generic
 */
import { Route } from './route';

export type RoutingStage = RoutingStart | RoutingStop;

export interface RoutingStart {
  readonly action: 'pre-navigate' | 'pre-replace';
  readonly from: Route;
  readonly to: Route;
  abort(): void;
}

export interface RoutingStop {
  readonly action: 'navigate' | 'replace' | 'return' | 'abort';
  readonly to: Route;
}
