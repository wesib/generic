import { BootstrapContext } from '@wesib/wesib';
import { OnEvent, onEventFromAny, trackValue, ValueTracker } from 'fun-events';
import { Navigation } from '../navigation';
import { Route } from './route';
import { RouteParam } from './route-param';
import { Router as Router_ } from './router';
import { RoutingHistory } from './routing-history.impl';
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
    const history = context.get(RoutingHistory);
    const route: OnEvent<[Route]> = navigation.read.thru_(
        ({ url, data }) => ({ url, data, param: getParam }),
    );

    this._route = (trackValue() as ValueTracker<Route>).by(route);

    const leave: OnEvent<[RoutingStart]> = navigation.onLeave.thru_(
        event => {

          const future = history.newEntry(event.from);
          const stage: RoutingStart = {
            action: event.when,
            from: this._route.it,
            to: {
              url: event.to.url,
              data: event.to.data,
              param(request) {
                return future.getParam(request);
              },
            },
            param<T, O>(request: RouteParam.Request<T, O>, options: O): T {
              return future.setParam(this, request, options);
            },
            abort() {
              event.preventDefault();
            },
          };

          return stage;
        },
    );
    const enter: OnEvent<[RoutingStop]> = navigation.onEnter.thru_(
        ({ when: action, to: { url, data} }) => ({
          action,
          to: {
            url,
            data,
            param: getParam,
          },
        }),
    );
    const stay: OnEvent<[RoutingStop]> = navigation.onStay.thru_(
        () => ({ action: 'abort' as const, to: this._route.it })
    );

    this.on = onEventFromAny<[RoutingStage]>(leave, enter, stay);

    history.init(this);

    function getParam<T>(this: Route, request: RouteParam.Request<T, unknown>): T | undefined {

      const entry = history.entry(this);

      return entry && entry.getParam(request);
    }
  }

  get read() {
    return this._route.read;
  }

}
