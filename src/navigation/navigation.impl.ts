import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, trackValue } from 'fun-events';
import { NavigateEvent, PreNavigateEvent } from './navigate.event';
import { Navigation as Navigation_ } from './navigation';

const PRE_NAVIGATE_EVT = 'wesib:preNavigate';
const NAVIGATE_EVT = 'wesib:navigate';

class NavigationLocation implements Navigation_.Location {

  readonly _url: URL;
  readonly data?: any;

  get url(): URL {
    return new URL(this._url.toString());
  }

  constructor({ url, data }: Navigation_.Location) {
    this._url = url;
    this.data = data;
  }

}

export function createNavigation(context: BootstrapContext): Navigation_ {

  const window = context.get(BootstrapWindow);
  const { document, location, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const preNavigate = dispatcher.on<PreNavigateEvent>(PRE_NAVIGATE_EVT);
  const onNavigate = dispatcher.on<NavigateEvent>(NAVIGATE_EVT);
  const nav = trackValue<NavigationLocation>(new NavigationLocation({
    url: new URL(location.href),
    data: history.state,
  }));
  dispatcher.on<PopStateEvent>('popstate')(event => {

    const from = nav.it._url;
    const to = new URL(location.href);
    const newData = event.state;
    const oldData = nav.it.data;

    dispatcher.dispatch(
        new NavigateEvent(
            NAVIGATE_EVT,
            {
              action: 'return',
              from,
              to,
              oldData,
              newData,
            })
    );
    nav.it = new NavigationLocation({ url: to, data: newData });
  });

  class Navigation extends Navigation_ {

    get length() {
      return history.length;
    }

    get preNavigate() {
      return preNavigate;
    }

    get onNavigate() {
      return onNavigate;
    }

    get read() {
      return nav.read;
    }

    go(delta?: number): void {
      history.go(delta);
    }

    navigate(target: Navigation_.Target | string | URL): boolean {

      const { url, data, title = '' } = navigationTargetOf(target);
      const from = nav.it._url;
      const to = url != null ? toURL(url) : from;

      const init: NavigateEvent.Init<'pre-navigate'> = {
        action: 'pre-navigate',
        from,
        to,
        oldData: nav.it.data,
        newData: data,
      };

      if (!dispatcher.dispatch(new NavigateEvent(PRE_NAVIGATE_EVT, init))) {
        return false; // Navigation cancelled
      }

      history.pushState(data, title, url && url.toString());
      nav.it = new NavigationLocation({ url: to, data });

      return dispatcher.dispatch(new NavigateEvent(NAVIGATE_EVT, { ...init, action: 'navigate' }));
    }

    replace(target: Navigation_.Target | string | URL): boolean {

      const { url, data, title = '' } = navigationTargetOf(target);
      const from = nav.it._url;
      const to = url != null ? toURL(url) : from;

      const init: NavigateEvent.Init<'pre-replace'> = {
        action: 'pre-replace',
        from,
        to,
        oldData: nav.it.data,
        newData: data,
      };

      if (!dispatcher.dispatch(new NavigateEvent(PRE_NAVIGATE_EVT, init))) {
        return false; // Navigation cancelled
      }

      history.replaceState(data, title, url && url.toString());
      nav.it = new NavigationLocation({ url: to, data });

      return dispatcher.dispatch(new NavigateEvent(NAVIGATE_EVT, { ...init, action: 'replace' }));
    }

  }

  return new Navigation();

  function toURL(url: string | URL): URL {
    if (typeof url === 'string') {
      return new URL(url, document.baseURI);
    }
    return url;
  }
}

function navigationTargetOf(target: Navigation_.Target | string | URL): Navigation_.Target {
  return typeof target === 'string' || target instanceof URL ? { url: target } : target;
}
