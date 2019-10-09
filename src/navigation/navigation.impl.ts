import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, onEventFromAny, trackValue } from 'fun-events';
import { Navigation as Navigation_ } from './navigation';
import { NavigationAgent } from './navigation-agent';
import {
  EnterPageEvent,
  LeavePageEvent,
  NavigationEvent,
  NavigationEventType,
  StayOnPageEvent,
} from './navigation.event';
import { Page, TargetPage } from './page';

export function createNavigation(context: BootstrapContext): Navigation_ {

  const window = context.get(BootstrapWindow);
  const { document, location, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const agent = context.get(NavigationAgent);
  const onEnter = dispatcher.on<EnterPageEvent>(NavigationEventType.EnterPage);
  const onLeave = dispatcher.on<LeavePageEvent>(NavigationEventType.LeavePage);
  const onStay = dispatcher.on<StayOnPageEvent>(NavigationEventType.StayOnPage);
  const onEvent = onEventFromAny<[NavigationEvent]>(onEnter, onLeave, onStay);
  const nav = trackValue<Page>({
    url: new URL(location.href),
    data: history.state,
  });
  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate')(event => {

    const data = event.state;
    const to: Page = { url: new URL(location.href), data: data };

    dispatcher.dispatch(
        new EnterPageEvent(
            NavigationEventType.EnterPage,
            {
              when: 'return',
              to,
            })
    );
    nav.it = to;
  });

  class Navigation extends Navigation_ {

    get length() {
      return history.length;
    }

    get onEnter() {
      return onEnter;
    }

    get onLeave() {
      return onLeave;
    }

    get onStay() {
      return onStay;
    }

    get on() {
      return onEvent;
    }

    get read() {
      return nav.read;
    }

    go(delta?: number): void {
      history.go(delta);
    }

    open(target: Navigation_.Target | string | URL) {
      return navigate('pre-open', 'open', 'pushState', target);
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

  function urlTargetOf(target: Navigation_.Target | string | URL): Navigation_.URLTarget {
    if (typeof target === 'string' || target instanceof URL) {
      return { url: toURL(target) };
    }
    if (target.url instanceof URL) {
      return target as Navigation_.URLTarget;
    }
    return { ...target, url: toURL(target.url) };
  }

  function navigate(
      whenLeave: 'pre-open' | 'pre-replace',
      whenEnter: 'open' | 'replace',
      method: 'pushState' | 'replaceState',
      target: Navigation_.Target | string | URL,
  ): Promise<boolean> {

    const urlTarget = urlTargetOf(target);
    const promise = next = next.then(doNavigate, doNavigate);

    return promise;

    function doNavigate(): boolean {

      let targetPage: TargetPage;

      try {

        const prepared = prepare();

        if (!prepared) {
          return prepared; // Navigation cancelled
        }

        targetPage = prepared;

        history[method](targetPage.data, targetPage.title || '', targetPage.url.href);
      } catch (e) {
        stay(e);
        throw e;
      }

      const enteredPage: Page = {
        url: targetPage.url,
        data: targetPage.data,
      };

      nav.it = enteredPage;

      return dispatcher.dispatch(new EnterPageEvent(
          NavigationEventType.EnterPage,
          {
            when: whenEnter,
            to: enteredPage,
          },
      ));
    }

    function prepare(): TargetPage | false {
      if (next !== promise) {
        return stay();
      }

      if (
          !dispatcher.dispatch(new LeavePageEvent(
              NavigationEventType.LeavePage,
              {
                when: whenLeave,
                from: nav.it,
                to: {
                  url: urlTarget.url,
                  title: urlTarget.title,
                  data: urlTarget.data,
                },
              },
          ))
          || next !== promise) {
        return stay();
      }

      let finalTarget: Navigation_.URLTarget | undefined;

      agent(t => finalTarget = t, whenLeave, nav.it, urlTarget);

      if (!finalTarget) {
        return stay(); // Some agent didn't call `next()`.
      }

      return {
        url: finalTarget.url,
        title: finalTarget.title,
        data: finalTarget.data,
      };
    }

    function stay(reason?: any): false {
      dispatcher.dispatch(new StayOnPageEvent(
          NavigationEventType.StayOnPage,
          {
            from: nav.it,
            to: urlTarget,
            reason,
          },
      ));
      return false;
    }
  }
}
