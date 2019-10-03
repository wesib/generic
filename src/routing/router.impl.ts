import { BootstrapContext } from '@wesib/wesib';
import { OnEvent, onEventFromAny, trackValue, ValueTracker } from 'fun-events';
import { Navigation } from '../navigation';
import { Route } from './route';
import { RouteAction, RouteRequest, RouteUpdate } from './route-action';
import { Router as Router_ } from './router';

/**
 * @internal
 */
export class Router extends Router_ {

  readonly on: OnEvent<[RouteAction]>;
  private readonly _route: ValueTracker<Route>;

  constructor(context: BootstrapContext) {
    super();

    const navigation = context.get(Navigation);
    const route: OnEvent<[Route]> = navigation.read.thru_(
        ({ url, data }) => ({ url, data }),
    );

    this._route = (trackValue() as ValueTracker<Route>).by(route);

    const request: OnEvent<[RouteRequest]> = navigation.preNavigate.thru_(
        event => ({
          type: event.action,
          from: this._route.it,
          to: {
            url: event.to,
            data: event.newData,
          },
          abort() {
            event.preventDefault();
          },
        }),
    );
    const reach: OnEvent<[RouteUpdate]> = navigation.onNavigate.thru_(
        ({ action: type, to: url, newData: data }) => ({
          type,
          to: {
            url,
            data,
          },
        }),
    );
    const abort: OnEvent<[RouteUpdate]> = navigation.dontNavigate.thru_(
        () => ({ type: 'abort' as const, to: this._route.it })
    );

    this.on = onEventFromAny<[RouteAction]>(request, reach, abort);
  }

  get read() {
    return this._route.read;
  }

}
