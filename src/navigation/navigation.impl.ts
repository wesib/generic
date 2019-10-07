import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, trackValue } from 'fun-events';
import { NavigateEvent, PreNavigateEvent } from './navigate.event';
import { Navigation as Navigation_ } from './navigation';
import { NavigationAgent } from './navigation-agent';

const PRE_NAVIGATE_EVT = 'wesib:preNavigate';
const DONT_NAVIGATE_EVT = 'wesib:dontNavigate';
const NAVIGATE_EVT = 'wesib:navigate';

export function createNavigation(context: BootstrapContext): Navigation_ {

  const window = context.get(BootstrapWindow);
  const { document, location, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const agent = context.get(NavigationAgent);
  const preNavigate = dispatcher.on<PreNavigateEvent>(PRE_NAVIGATE_EVT);
  const dontNavigate = dispatcher.on<PreNavigateEvent>(DONT_NAVIGATE_EVT);
  const onNavigate = dispatcher.on<NavigateEvent>(NAVIGATE_EVT);
  const nav = trackValue<Navigation_.Location>({
    url: new URL(location.href),
    data: history.state,
  });
  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate')(event => {

    const from = nav.it;
    const data = event.state;
    const to: Navigation_.URLTarget = { url: new URL(location.href), data: data };

    dispatcher.dispatch(
        new NavigateEvent(
            NAVIGATE_EVT,
            {
              action: 'return',
              from,
              to,
            })
    );
    nav.it = { url: to.url, data };
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

    get dontNavigate() {
      return dontNavigate;
    }

    get read() {
      return nav.read;
    }

    go(delta?: number): void {
      history.go(delta);
    }

    navigate(target: Navigation_.Target | string | URL) {
      return navigate('pre-navigate', 'navigate', 'pushState', target);
    }

    replace(target: Navigation_.Target | string | URL) {
      return navigate('pre-replace', 'replace', 'replaceState', target);
    }

  }

  return new Navigation();

  function toURL(url: string | URL | undefined): URL {
    if (typeof url === 'string') {
      return new URL(url, document.baseURI);
    }
    return url || nav.it.url;
  }

  function navigationTargetOf(target: Navigation_.Target | string | URL): Navigation_.URLTarget {
    if (typeof target === 'string' || target instanceof URL) {
      return { url: toURL(target) };
    }
    if (target.url instanceof URL) {
      return target as Navigation_.URLTarget;
    }
    return { ...target, url: toURL(target.url) };
  }

  function navigate(
      preAction: 'pre-navigate' | 'pre-replace',
      action: 'navigate' | 'replace',
      method: 'pushState' | 'replaceState',
      target: Navigation_.Target | string | URL,
  ): Promise<boolean> {

    const promise = next = next.then(doNavigate, doNavigate);

    return promise;

    function doNavigate(): boolean {

      const res = prepare();

      if (!res) {
        return res; // Navigation cancelled
      }

      const init = res;

      try {
        history[method](init.to.data, init.to.title || '', init.to.url.toString());
      } catch (e) {
        dispatcher.dispatch(new NavigateEvent(DONT_NAVIGATE_EVT, init));
        throw e;
      }
      nav.it = { url: init.to.url, data: init.to.data };

      return dispatcher.dispatch(new NavigateEvent(NAVIGATE_EVT, { ...init, action }));
    }

    function prepare(): NavigateEvent.Init<typeof preAction> | false {

      const navTarget = navigationTargetOf(target);

      if (next !== promise) {
        return dont();
      }

      let finalTarget: Navigation_.URLTarget | undefined;

      agent(t => finalTarget = t, preAction, nav.it, navTarget);

      if (!finalTarget) {
        return dont();
      }

      const init = newEventInit(finalTarget);

      if (
          !dispatcher.dispatch(new NavigateEvent(PRE_NAVIGATE_EVT, init))
          || next !== promise) {
        return dont(init);
      }

      return init;

      function dont(eventInit: NavigateEvent.Init<typeof preAction> = newEventInit(navTarget)): false {
        dispatcher.dispatch(new NavigateEvent(DONT_NAVIGATE_EVT, eventInit));
        return false;
      }

      function newEventInit(to: Navigation_.URLTarget): NavigateEvent.Init<typeof preAction> {
        return {
          action: preAction,
          from: nav.it,
          to,
        };
      }
    }
  }
}
