import { BootstrapContext } from '@wesib/wesib';
import { OnEvent, onEventFromAny, trackValue, ValueTracker } from 'fun-events';
import { Navigation } from '../navigation';
import { Route } from './route';
import { Router as Router_ } from './router';
import { RoutingStage, RoutingStart, RoutingStop } from './routing-stage';

/**
 * @internal
 */
export class Router extends Router_ {

  readonly on: OnEvent<[RoutingStage]>;
  private readonly _route: ValueTracker<Route>;

  constructor(context: BootstrapContext) {
    super();

    const navigation = context.get(Navigation);
    const route: OnEvent<[Route]> = navigation.read.thru_(
        ({ url, data }) => ({ url, data }),
    );

    this._route = (trackValue() as ValueTracker<Route>).by(route);

    const start: OnEvent<[RoutingStart]> = navigation.preNavigate.thru_(
        event => ({
          action: event.action,
          from: this._route.it,
          to: {
            url: event.to.url,
            data: event.to.data,
          },
          abort() {
            event.preventDefault();
          },
        }),
    );
    const stop: OnEvent<[RoutingStop]> = navigation.onNavigate.thru_(
        ({ action, to: { url, data} }) => ({
          action,
          to: {
            url,
            data,
          },
        }),
    );
    const abort: OnEvent<[RoutingStop]> = navigation.dontNavigate.thru_(
        () => ({ action: 'abort' as const, to: this._route.it })
    );

    this.on = onEventFromAny<[RoutingStage]>(start, stop, abort);
  }

  get read() {
    return this._route.read;
  }

}
