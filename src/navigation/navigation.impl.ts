import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { AfterEvent, DomEventDispatcher, onEventFromAny, trackValue } from 'fun-events';
import { NavHistory, PageEntry, toHistoryState } from './nav-history.impl';
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
  const { document, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const navHistory = context.get(NavHistory);
  const agent = context.get(NavigationAgent);
  const onEnter = dispatcher.on<EnterPageEvent>(NavigationEventType.EnterPage);
  const onLeave = dispatcher.on<LeavePageEvent>(NavigationEventType.LeavePage);
  const onStay = dispatcher.on<StayOnPageEvent>(NavigationEventType.StayOnPage);
  const onEvent = onEventFromAny<[NavigationEvent]>(onEnter, onLeave, onStay);
  const nav = trackValue<[Page, PageEntry?]>([navHistory.init()]);
  const readPage: AfterEvent<[Page]> = nav.read.keep.thru(([page]) => page);
  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate')(event => {

    const [enterPage, pageId] = navHistory.return(nav.it[1], event);

    nav.it = [enterPage.to, pageId];
    dispatcher.dispatch(enterPage);
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
      return navigate('pre-open', 'pushState', target);
    }

    replace(target: Navigation_.Target | string | URL) {
      return navigate('pre-replace', 'replaceState', target);
    }

  }

  return new Navigation();

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
      method: 'pushState' | 'replaceState',
      target: Navigation_.Target | string | URL,
  ): Promise<boolean> {

    const urlTarget = urlTargetOf(target);
    const promise = next = next.then(doNavigate, doNavigate);

    return promise;

    function doNavigate(): boolean {

      let fromEntry: PageEntry | undefined;
      let toPage: TargetPage;
      let toEntry: PageEntry | undefined;

      try {

        const prepared = prepare();

        if (!prepared) {
          return prepared; // Navigation cancelled
        }

        [fromEntry, toPage, toEntry] = prepared;

        history[method](toHistoryState(toPage.data, toEntry.id), toPage.title || '', toPage.url.href);
      } catch (e) {
        stay(toEntry, e);
        throw e;
      }

      const enterPage = navHistory[method](fromEntry, toPage, toEntry);

      nav.it = [enterPage.to, toEntry];

      return dispatcher.dispatch(enterPage);
    }

    function prepare(): [PageEntry | undefined, TargetPage, PageEntry] | false {
      if (next !== promise) {
        return stay();
      }

      const [fromPage, fromEntry] = nav.it;
      const [leavePage, toEntry] = navHistory.leave(whenLeave, fromPage, urlTarget);

      if (!dispatcher.dispatch(leavePage) || next !== promise) {
        return stay(toEntry);
      }

      let finalTarget: Navigation_.URLTarget | undefined;

      agent(t => finalTarget = t, whenLeave, leavePage.from, leavePage.to);

      if (!finalTarget) {
        return stay(toEntry); // Some agent didn't call `next()`.
      }

      return [
        fromEntry,
        {
          url: finalTarget.url,
          title: finalTarget.title,
          data: finalTarget.data,
          get(request) {
            return toEntry.getParam(request);
          },
        },
        toEntry,
      ];
    }

    function stay(toEntry?: PageEntry, reason?: any): false {
      dispatcher.dispatch(navHistory.stay(nav.it[0], urlTarget, toEntry, reason));
      return false;
    }
  }
}
