import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { AfterEvent, DomEventDispatcher, onEventFromAny, trackValue } from 'fun-events';
import { NAV_PAGE_ID, NavHistory, toHistoryState, toNavData } from './nav-history.impl';
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
import { PageParam } from './page-param';

export function createNavigation(context: BootstrapContext): Navigation_ {

  const window = context.get(BootstrapWindow);
  const { document, location, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const navHistory = context.get(NavHistory);
  const agent = context.get(NavigationAgent);
  const onEnter = dispatcher.on<EnterPageEvent>(NavigationEventType.EnterPage);
  const onLeave = dispatcher.on<LeavePageEvent>(NavigationEventType.LeavePage);
  const onStay = dispatcher.on<StayOnPageEvent>(NavigationEventType.StayOnPage);
  const onEvent = onEventFromAny<[NavigationEvent]>(onEnter, onLeave, onStay);
  const initNavData = toNavData(history.state);
  const nav = trackValue<[Page, number?]>([
    {
      url: new URL(location.href),
      data: initNavData[0],
      get(request) {
        return getParam(initNavData[1], request);
      },
    },
    initNavData[1],
  ]);
  const readPage: AfterEvent<[Page]> = nav.read.keep.thru(([page]) => page);
  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate')(event => {

    const popNavData = toNavData(event.state);
    const to: Page = {
      url: new URL(location.href),
      data: popNavData[0],
      get(request) {
        return getParam(popNavData[1], request);
      },
    };
    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'return',
          to,
        },
    );

    (enterPage as any)[NAV_PAGE_ID] = popNavData[1];
    dispatcher.dispatch(enterPage);
    nav.it = [to, popNavData[1]];
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
      return readPage;
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

  const navigation = new Navigation();

  navHistory.init(navigation);

  return navigation;

  function toURL(url: string | URL | undefined): URL {
    if (typeof url === 'string') {
      return new URL(url, document.baseURI);
    }
    return url || nav.it[0].url;
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
      let pageId: number | undefined;

      try {

        const prepared = prepare();

        if (!prepared) {
          return prepared; // Navigation cancelled
        }

        [targetPage, pageId] = prepared;

        history[method](toHistoryState(targetPage.data, pageId), targetPage.title || '', targetPage.url.href);
      } catch (e) {
        stay(e);
        throw e;
      }

      const enteredPage: Page = {
        url: targetPage.url,
        data: targetPage.data,
        get(request) {
          return targetPage.get(request);
        },
      };

      nav.it = [enteredPage, pageId];

      return dispatcher.dispatch(new EnterPageEvent(
          NavigationEventType.EnterPage,
          {
            when: whenEnter,
            to: enteredPage,
          },
      ));
    }

    function prepare(): [TargetPage, number?] | false {
      if (next !== promise) {
        return stay();
      }

      const toEntry = navHistory.newEntry(nav.it[1]);
      const to: TargetPage = {
        url: urlTarget.url,
        title: urlTarget.title,
        data: urlTarget.data,
        get(request) {
          return toEntry && toEntry.getParam(request);
        },
      };

      class LeavePage extends LeavePageEvent {

        set<T, O>(request: PageParam.Request<T, O>, options: O): this {
          toEntry.setParam(this, request, options);
          return this;
        }

      }

      if (
          !dispatcher.dispatch(new LeavePage(
              NavigationEventType.LeavePage,
              {
                when: whenLeave,
                from: nav.it[0],
                to,
              },
          ))
          || next !== promise) {
        return stay();
      }

      let finalTarget: Navigation_.URLTarget | undefined;

      agent(t => finalTarget = t, whenLeave, nav.it[0], to);

      if (!finalTarget) {
        return stay(); // Some agent didn't call `next()`.
      }

      return [
        {
          url: finalTarget.url,
          title: finalTarget.title,
          data: finalTarget.data,
          get(request) {
            return to.get(request);
          },
        },
        toEntry.id,
      ];
    }

    function stay(reason?: any): false {
      dispatcher.dispatch(new StayOnPageEvent(
          NavigationEventType.StayOnPage,
          {
            from: nav.it[0],
            to: urlTarget,
            reason,
          },
      ));
      return false;
    }
  }

  function getParam<T>(pageId: number | undefined, request: PageParam.Request<T, unknown>): T | undefined {

    const entry = navHistory.entry(pageId);

    return entry && entry.getParam(request);
  }
}
