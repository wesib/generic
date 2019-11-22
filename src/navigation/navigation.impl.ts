import { BootstrapContext, BootstrapWindow, mergeFunctions } from '@wesib/wesib';
import { noop } from 'call-thru';
import { AfterEvent, DomEventDispatcher, onAny, trackValue } from 'fun-events';
import { NavHistory, PageEntry } from './nav-history.impl';
import { Navigation as Navigation_ } from './navigation';
import { NavigationAgent } from './navigation-agent';
import {
  EnterPageEvent,
  LeavePageEvent,
  NavigationEvent,
  NavigationEventType,
  StayOnPageEvent,
} from './navigation.event';
import { Page } from './page';
import { PageParam } from './page-param';

export function createNavigation(context: BootstrapContext): Navigation_ {

  const window = context.get(BootstrapWindow);
  const { document, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const navHistory = context.get(NavHistory);
  const agent = context.get(NavigationAgent);
  const onEnter = dispatcher.on<EnterPageEvent>(NavigationEventType.EnterPage);
  const onLeave = dispatcher.on<LeavePageEvent>(NavigationEventType.LeavePage);
  const onStay = dispatcher.on<StayOnPageEvent>(NavigationEventType.StayOnPage);
  const onEvent = onAny<[NavigationEvent]>(onEnter, onLeave, onStay);
  const nav = trackValue<PageEntry>(navHistory.init());

  nav.read(nextEntry => nextEntry.apply()); // The very first page entry receiver applies scheduled updates to page

  const readPage: AfterEvent<[Page]> = nav.read.keep.thru(entry => entry.page);
  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate')(popState => {

    const entry = navHistory.popState(popState, nav);

    if (entry) {
      dispatcher.dispatch(new EnterPageEvent(
          NavigationEventType.EnterPage,
          {
            when: popState.state != null ? 'return' : 'enter',
            to: entry.page,
          },
      ));
    }
  });

  dispatcher.on('hashchange')(() => {

    const entry = navHistory.hashChange(nav);

    if (entry) {
      dispatcher.dispatch(new EnterPageEvent(
          NavigationEventType.EnterPage,
          {
            when: 'enter',
            to: entry.page,
          },
      ));
    }
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
      return navigate('pre-open', 'open', target);
    }

    replace(target: Navigation_.Target | string | URL) {
      return navigate('pre-replace', 'replace', target);
    }

    update(url: string | URL): Page {
      return navHistory.update(nav, toURL(url)).page;
    }

    with<T, I>(ref: PageParam.Ref<T, I>, input: I): Navigation_.Parameterized {
      return withParam(page => page.put(ref, input));
    }

  }

  return new Navigation();

  function withParam(applyParams: (page: Page) => void): Navigation_.Parameterized {
    return {
      with<TT, II>(ref: PageParam.Ref<TT, II>, input: II): Navigation_.Parameterized {
        return withParam(mergeFunctions(applyParams, page => page.put(ref, input)));
      },
      open(target: Navigation_.Target | string | URL) {
        return navigate('pre-open', 'open', target, applyParams);
      },
      replace(target: Navigation_.Target | string | URL) {
        return navigate('pre-replace', 'replace', target, applyParams);
      },
    };
  }

  function toURL(url: string | URL | undefined): URL {
    if (typeof url === 'string') {
      return new URL(url, document.baseURI);
    }
    return url || nav.it.page.url;
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
      when: 'open' | 'replace',
      target: Navigation_.Target | string | URL,
      applyParams: (page: Page) => void = noop,
  ): Promise<Page | null> {

    const urlTarget = urlTargetOf(target);
    const promise = next = next.then(doNavigate, doNavigate);

    return promise;

    function doNavigate(): Page | null {

      let toEntry: PageEntry | undefined;

      try {

        const prepared = prepare();

        if (!prepared) {
          return prepared; // Navigation cancelled
        }

        toEntry = prepared;

        navHistory[when](toEntry, nav);

        dispatcher.dispatch(new EnterPageEvent(
            NavigationEventType.EnterPage,
            {
              when,
              to: toEntry.page,
            },
        ));

        return toEntry.page;
      } catch (e) {
        stay(toEntry, e);
        throw e;
      }
    }

    function prepare(): PageEntry | null {
      if (next !== promise) {
        return stay();
      }

      const fromEntry = nav.it;
      const toEntry = navHistory.newEntry(urlTarget);

      fromEntry.transfer(toEntry, whenLeave);

      const leavePage = new LeavePageEvent(
          NavigationEventType.LeavePage,
          {
            when: whenLeave,
            from: fromEntry.page,
            to: toEntry.page,
          },
      );

      applyParams(toEntry.page);
      if (!dispatcher.dispatch(leavePage) || next !== promise) {
        return stay(toEntry);
      }

      let finalTarget: Navigation_.URLTarget | undefined;

      agent(t => finalTarget = t, whenLeave, leavePage.from, leavePage.to);

      if (!finalTarget) {
        return stay(toEntry); // Some agent didn't call `next()`.
      }

      return toEntry;
    }

    function stay(toEntry?: PageEntry, reason?: any): null {
      if (toEntry) {
        toEntry.stay(nav.it.page);
      }

      dispatcher.dispatch(new StayOnPageEvent(
          NavigationEventType.StayOnPage,
          {
            from: nav.it.page,
            to: urlTarget,
            reason,
          },
      ));

      return null;
    }

  }
}
