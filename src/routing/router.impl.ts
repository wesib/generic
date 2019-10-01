import { BootstrapContext } from '@wesib/wesib';
import { OnEvent, onEventFromAny, trackValue, ValueTracker } from 'fun-events';
import { Navigation } from '../navigation';
import { Route } from './route';
import { Router as Router_ } from './router';

/**
 * @internal
 */
export class Router extends Router_ {

  private readonly _active: ValueTracker<Route.Active>;
  private readonly _route: ValueTracker<Route>;

  constructor(context: BootstrapContext) {
    super();

    const navigation = context.get(Navigation);
    const active: OnEvent<[Route.Active]> = navigation.read.thru_(
        ({ url }) => ({ type: 'active' as const, url }),
    );
    const next: OnEvent<[Route.Next]> = navigation.preNavigate.thru_(
        event => ({
          type: event.action,
          from: this._active.it,
          url: event.to,
          cancel() {
            event.preventDefault();
          },
        }),
    );
    const dont: OnEvent<[Route.Active]> = navigation.dontNavigate.thru_(
        ({ from: url }) => ({ type: 'active' as const, url })
    );

    this._active = (trackValue() as ValueTracker<Route.Active>).by(onEventFromAny(active, dont));
    this._route = trackValue<Route>(this._active.it).by(onEventFromAny<[Route]>(this._active, next));
  }

  get read() {
    return this._route.read;
  }

  get readActive() {
    return this._active.read;
  }

}
