import { BootstrapContext, BootstrapWindow, mergeFunctions } from '@wesib/wesib';
import { noop } from 'call-thru';
import { AfterEvent, EventReceiver, EventSupply, onAny, OnEvent, trackValue } from 'fun-events';
import { DomEventDispatcher, DomEventListener, OnDomEvent } from 'fun-events/dom';
import { NavHistory, PageEntry } from './nav-history.impl';
import { Navigation as Navigation } from './navigation';
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

export function createNavigation(context: BootstrapContext): Navigation {

  const window = context.get(BootstrapWindow);
  const { document, history } = window;
  const dispatcher = new DomEventDispatcher(window);
  const navHistory = context.get(NavHistory);
  const agent = context.get(NavigationAgent);
  const nav = trackValue<PageEntry>(navHistory.init());

  nav.read(nextEntry => nextEntry.apply()); // The very first page entry receiver applies scheduled updates to page

  let next: Promise<any> = Promise.resolve();

  dispatcher.on<PopStateEvent>('popstate').to(popState => {

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

  dispatcher.on('hashchange').to(() => {

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

  type NavTarget = { -readonly [K in keyof Navigation.URLTarget]: Navigation.URLTarget[K] };

  class Navigation$ extends Navigation {

    get page(): Page {
      return nav.it.page;
    }

    get length(): number {
      return history.length;
    }

    onEnter(): OnDomEvent<EnterPageEvent>;
    onEnter(listener: DomEventListener<EnterPageEvent>): EventSupply;
    onEnter(listener?: DomEventListener<EnterPageEvent>): OnDomEvent<EnterPageEvent> | EventSupply {
      return (this.onEnter = dispatcher.on<EnterPageEvent>(NavigationEventType.EnterPage).F)(listener);
    }

    onLeave(): OnDomEvent<LeavePageEvent>;
    onLeave(listener: DomEventListener<LeavePageEvent>): EventSupply;
    onLeave(listener?: DomEventListener<LeavePageEvent>): OnDomEvent<LeavePageEvent> | EventSupply {
      return (this.onLeave = dispatcher.on<LeavePageEvent>(NavigationEventType.LeavePage).F)(listener);
    }

    onStay(): OnDomEvent<StayOnPageEvent>;
    onStay(listener: DomEventListener<StayOnPageEvent>): EventSupply;
    onStay(listener?: DomEventListener<StayOnPageEvent>): OnDomEvent<StayOnPageEvent> | EventSupply {
      return (this.onStay = dispatcher.on<StayOnPageEvent>(NavigationEventType.StayOnPage).F)(listener);
    }

    /**
     * Builds an `OnEvent` sender of {@link NavigationEvent navigation events}.
     *
     * The `[OnEvent__symbol]` property is an alias of this one.
     *
     * @returns `OnEvent` sender of {@link NavigationEvent navigation events}.
     */
    on(): OnEvent<[NavigationEvent]>;
    on(receiver: EventReceiver<[NavigationEvent]>): EventSupply;
    on(receiver?: EventReceiver<[NavigationEvent]>): OnEvent<[NavigationEvent]> | EventSupply {
      return (this.on = onAny<[NavigationEvent]>(this.onEnter(), this.onLeave(), this.onStay()).F)(receiver);
    }

    read(): AfterEvent<[Page]>;
    read(receiver: EventReceiver<[Page]>): EventSupply;
    read(receiver?: EventReceiver<[Page]>): AfterEvent<[Page]> | EventSupply {
      return (this.read = nav.read().keepThru(entry => entry.page).F)(receiver);
    }

    go(delta?: number): void {
      history.go(delta);
    }

    open(target: Navigation.Target | string | URL): Promise<Page | null> {
      return navigate('pre-open', 'open', target);
    }

    replace(target: Navigation.Target | string | URL): Promise<Page | null> {
      return navigate('pre-replace', 'replace', target);
    }

    update(url: string | URL): Page {
      return navHistory.update(nav, toURL(url)).page;
    }

    with<T, I>(ref: PageParam.Ref<T, I>, input: I): Navigation.Parameterized {
      return withParam(page => page.put(ref, input));
    }

  }

  return new Navigation$();

  function withParam(applyParams: (page: Page) => void): Navigation.Parameterized {
    return {
      with<TT, II>(ref: PageParam.Ref<TT, II>, input: II): Navigation.Parameterized {
        return withParam(mergeFunctions(applyParams, page => page.put(ref, input)));
      },
      open(target?: Navigation.Target | string | URL) {
        return navigate('pre-open', 'open', target, applyParams);
      },
      replace(target?: Navigation.Target | string | URL) {
        return navigate('pre-replace', 'replace', target, applyParams);
      },
      pretend<T>(
          targetOrCallback?: Navigation.Target | string | URL | ((this: void, from: Page, to: Page) => T),
          callback: (this: void, from: Page, to: Page) => T = (_from, to) => to as unknown as T,
      ): T | undefined {

        let target: Navigation.Target | string | URL | undefined;

        if (typeof targetOrCallback === 'function') {
          callback = targetOrCallback;
          target = undefined;
        } else {
          target = targetOrCallback;
        }

        const navTarget = navTargetOf(target);
        const fromEntry = nav.it;
        const toEntry = newEntry('pretend', fromEntry, navTarget, applyParams);

        try {
          return applyAgent('pretend', fromEntry, navTarget, toEntry)
              ? callback(fromEntry.page, toEntry.page)
              : undefined;
        } finally {
          toEntry.stay(nav.it.page);
        }
      },
    };
  }

  function toURL(url: string | URL | undefined): URL {
    if (typeof url === 'string') {
      return new URL(url, document.baseURI);
    }
    return url || nav.it.page.url;
  }

  function navTargetOf(target?: Navigation.Target | string | URL): NavTarget {
    if (target == null || typeof target === 'string' || target instanceof URL) {
      return { url: toURL(target) };
    }
    if (target.url instanceof URL) {
      return target as Navigation.URLTarget;
    }
    return { ...target, url: toURL(target.url) };
  }

  function navigate(
      whenLeave: 'pre-open' | 'pre-replace',
      when: 'open' | 'replace',
      target?: Navigation.Target | string | URL,
      applyParams: (page: Page) => void = noop,
  ): Promise<Page | null> {

    const navTarget = navTargetOf(target);
    const promise = next = next.then(doNavigate, doNavigate);

    return promise;

    function doNavigate(): Page | null {

      let toEntry: PageEntry | undefined = undefined;

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
      const toEntry = newEntry(whenLeave, fromEntry, navTarget, applyParams);
      const leavePage = new LeavePageEvent(
          NavigationEventType.LeavePage,
          {
            when: whenLeave,
            from: fromEntry.page,
            to: toEntry.page,
          },
      );

      if (!dispatcher.dispatch(leavePage)
          || next !== promise
          || !applyAgent(whenLeave, fromEntry, navTarget, toEntry)) {
        return stay(toEntry);
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
            to: navTarget,
            reason,
          },
      ));

      return null;
    }

  }

  function newEntry(
      whenLeave: 'pretend' | 'pre-open' | 'pre-replace',
      fromEntry: PageEntry,
      navTarget: NavTarget,
      applyParams: (page: Page) => void,
  ): PageEntry {

    const toEntry = navHistory.newEntry(navTarget);

    try {
      fromEntry.transfer(toEntry, whenLeave);
      applyParams(toEntry.page);
    } catch (e) {
      toEntry.stay(nav.it.page);
      throw e;
    }

    return toEntry;
  }

  function applyAgent(
      whenLeave: 'pretend' | 'pre-open' | 'pre-replace',
      fromEntry: PageEntry,
      navTarget: NavTarget,
      toEntry: PageEntry,
  ): boolean {

    let navigated = false;

    agent(
        ({ url, data, title }) => {
          navigated = true;
          navTarget.url = url;
          navTarget.data = data;
          navTarget.title = title;
        },
        whenLeave,
        fromEntry.page,
        toEntry.page,
    );

    return navigated;
  }

}
