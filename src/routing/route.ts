/**
 * @module @wesib/generic
 */

export type Route = Route.Next | Route.Active;

export namespace Route {

  export interface Next {
    readonly type: 'pre-navigate' | 'pre-replace';
    readonly url: URL;
    readonly from: Route.Active;
    cancel(): void;
  }

  export interface Active {
    readonly type: 'active';
    readonly url: URL;
  }

}
