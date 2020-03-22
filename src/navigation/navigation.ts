/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import {
  AfterEvent,
  AfterEvent__symbol,
  EventKeeper,
  EventReceiver,
  EventSender,
  EventSupply,
  OnEvent,
  OnEvent__symbol,
} from '@proc7ts/fun-events';
import { DomEventListener, OnDomEvent } from '@proc7ts/fun-events/dom';
import { EnterPageEvent, LeavePageEvent, NavigationEvent, StayOnPageEvent } from './navigation.event';
import { Page } from './page';
import { PageParam } from './page-param';

/**
 * @internal
 */
const Navigation__key = (/*#__PURE__*/ new SingleContextKey<Navigation>('navigation'));

/**
 * Browser navigation service.
 *
 * Expected to be used as a [History] and [Location] APIs replacement.
 *
 * Fires additional navigation events the browser does not support natively.
 *
 * Implements an `EventSender` interface by sending {@link NavigationEvent navigation events} to registered receivers.
 *
 * Implements an `EventKeeper` interface by sending current {@link Page page} to registered receivers.
 *
 * Available as bootstrap context value when [[NavigationSupport]] feature is enabled.
 *
 * [History]: https://developer.mozilla.org/en-US/docs/Web/API/History
 * [Location]: https://developer.mozilla.org/en-US/docs/Web/API/Location
 */
export abstract class Navigation implements EventSender<[NavigationEvent]>, EventKeeper<[Page]> {

  static get [ContextKey__symbol](): ContextKey<Navigation> {
    return Navigation__key;
  }

  /**
   * Current page.
   */
  abstract readonly page: Page;

  /**
   * The number of element in navigation history.
   */
  abstract readonly length: number;

  /**
   * Build an `OnDomEvent` sender of {@link EnterPageEvent enter page events}.
   *
   * @returns An `OnDomEvent` sender of {@link EnterPageEvent enter page events}.
   */
  abstract onEnter(): OnDomEvent<EnterPageEvent>;

  /**
   * Starts sending {@link EnterPageEvent enter page events} to the given `listener`.
   *
   * @param listener  Target listener of {@link EnterPageEvent enter page events}.
   *
   * @returns {@link EnterPageEvent Enter page events} supply.
   */
  abstract onEnter(listener: DomEventListener<EnterPageEvent>): EventSupply;

  /**
   * Builds an `OnDomEvent` sender of {@link LeavePageEvent leave page events}.
   *
   * The registered listener may cancel navigation by calling `preventDefault()` method of received event.
   *
   * @returns `OnDomEvent` sender of {@link LeavePageEvent leave page events}.
   */
  abstract onLeave(): OnDomEvent<LeavePageEvent>;

  /**
   * Starts sending {@link LeavePageEvent leave page events} to the given `listener`.
   *
   * The registered listener may cancel navigation by calling `preventDefault()` method of received event.
   *
   * @param listener  Target listener of {@link LeavePageEvent leave page events}.
   *
   * @returns {@link LeavePageEvent Leave page events} supply.
   */
  abstract onLeave(listener: DomEventListener<LeavePageEvent>): EventSupply;

  /**
   * Builds an `OnDomEvent` {@link StayOnPageEvent stay on page events}.
   *
   * The registered listener is informed when navigation has been cancelled by one of leave page event receivers,
   * navigation failed due to e.g. invalid URL, or when another navigation request initiated before the page left.
   *
   * @returns `OnDomEvent` sender of {@link StayOnPageEvent stay on page events}.
   */
  abstract onStay(): OnDomEvent<StayOnPageEvent>;

  /**
   * Starts sending {@link StayOnPageEvent stay on page events} to the given `listener`.
   *
   * @param listener  Target listener of {@link StayOnPageEvent stay on page events}.
   *
   * @returns {@link StayOnPageEvent Stay on page events} supply.
   */
  abstract onStay(listener: DomEventListener<StayOnPageEvent>): EventSupply;

  /**
   * Builds an `OnEvent` sender of {@link NavigationEvent navigation events}.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   *
   * @returns `OnEvent` sender of {@link NavigationEvent navigation events}.
   */
  abstract on(): OnEvent<[NavigationEvent]>;

  /**
   * Starts sending of {@link NavigationEvent navigation events} to the given `receiver`.
   *
   * @param receiver  Target receiver of {@link NavigationEvent navigation events}.
   *
   * @returns {@link NavigationEvent Navigation events} supply.
   */
  abstract on(receiver: EventReceiver<[NavigationEvent]>): EventSupply;

  [OnEvent__symbol](): OnEvent<[NavigationEvent]> {
    return this.on();
  }

  /**
   * Builds an `AfterEvent` keeper of {@link page current page}.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   *
   * @returns An `AfterEvent` keeper of {@link page current page}.
   */
  abstract read(): AfterEvent<[Page]>;

  /**
   * Starts sending {@link page current page} and updates to the given `receiver.
   *
   * @param receiver  Target receiver of {@link page current page}.
   *
   * @returns {@link page Current page} supply.
   */
  abstract read(receiver: EventReceiver<[Page]>): EventSupply;

  [AfterEvent__symbol](): AfterEvent<[Page]> {
    return this.read();
  }

  /**
   * Goes to the previous page in navigation history.
   *
   * Calling this method is the same as calling `go(-1)`.
   */
  back(): void {
    this.go(-1);
  }

  /**
   * Goes to the next page in navigation history.
   *
   * Calling this method is the same as calling `go(1)`.
   */
  forward(): void {
    this.go(1);
  }

  /**
   * Loads a page from navigation history, identified by its relative location to the current page.
   *
   * For example `-1` navigates to previous page, while `1` navigates to the next one. If you specify an out-of-bounds
   * value (for instance, specifying -1 when there are no previously-visited pages in navigation history), this method
   * silently has no effect.
   *
   * @param delta  Relative location in navigation history to navigate to. The absent value or value of `0` reloads
   * the current page.
   */
  abstract go(delta?: number): void;

  /**
   * Reloads current page.
   *
   * Calling this method is the same as calling `go()`.
   */
  reload(): void {
    this.go();
  }

  /**
   * Opens a page by navigating to the given `target`.
   *
   * Appends an entry to navigation history.
   *
   * @param target  Either navigation target or URL to navigate to.
   * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually navigate.
   * Then navigates to the `target`, unless the event cancelled.
   * @fires NavigateEvent@wesib:navigate  On window object when navigation succeed.
   *
   * @returns A promise resolved to navigated page, or to `null` otherwise.
   */
  abstract open(target: Navigation.Target | string | URL): Promise<Page | null>;

  /**
   * Replaces current navigation history entry with the given `target`.
   *
   * @param target  Either navigation target or URL to replace current history entry with.
   * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually update the history.
   * Then navigates to the `target`, unless the event cancelled.
   * @fires NavigateEvent@wesib:navigate  On window object when history updated.
   *
   * @returns A promise resolved to navigated page, or to `null` otherwise.
   */
  abstract replace(target: Navigation.Target | string | URL): Promise<Page | null>;

  /**
   * Replaces current page URL with the given one.
   *
   * Does not alter current page state, and does not trigger any events.
   *
   * @param url  An URL to replace the the current one with.
   *
   * @returns Current page with updated URL.
   */
  abstract update(url: string | URL): Page;

  /**
   * Creates parameterized navigation instance and assigns a page parameter to apply to target page.
   *
   * @typeparam T  Parameter value type.
   * @typeparam I  Parameter input type.
   * @param ref  A reference to page navigation parameter to apply.
   * @param input  Parameter input to use when constructing its value.
   *
   * @returns New parameterized navigation instance.
   */
  abstract with<T, I>(ref: PageParam.Ref<T, I>, input: I): Navigation.Parameterized;

}

export namespace Navigation {

  /**
   * Parameterized navigation.
   *
   * Allows to assign target page parameters prior to navigating to it.
   */
  export interface Parameterized {

    /**
     * Applies parameter to navigation target page.
     *
     * @typeparam T  Parameter value type.
     * @typeparam I  Parameter input type.
     * @param ref  A reference to page navigation parameter to apply.
     * @param input  Parameter input to use when constructing its value.
     *
     * @returns New parameterized navigation instance.
     */
    with<T, I>(ref: PageParam.Ref<T, I>, input: I): Parameterized;

    /**
     * Opens a page by navigating to the given `target` with provided page parameters.
     *
     * Appends an entry to navigation history.
     *
     * @param target  Either navigation target or URL to navigate to. Navigates to current page URL when omitted.
     * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually navigate.
     * Then navigates to the `target`, unless the event cancelled.
     * @fires NavigateEvent@wesib:navigate  On window object when navigation succeed.
     *
     * @returns A promise resolved to navigated page, or to `null` otherwise.
     */
    open(target?: Navigation.Target | string | URL): Promise<Page | null>;

    /**
     * Replaces the most recent entry in navigation history with the given `target` and provided page parameters.
     *
     * @param target  Either navigation target or URL to replace the latest history entry with. Navigates to current
     * page URL when omitted.
     * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually update the history.
     * Then navigates to the `target`, unless the event cancelled.
     * @fires NavigateEvent@wesib:navigate  On window object when history updated.
     *
     * @returns A promise resolved to navigated page, or to `null` otherwise.
     */
    replace(target?: Navigation.Target | string | URL): Promise<Page | null>;

    /**
     * Pretends navigation.
     *
     * Prepares navigation and parameters, but does not actually navigate. Instead it calls the provided callback
     * function.
     *
     * This is useful e.g. to build target URL or evaluate target page parameter.
     *
     * @param target  Either navigation target or URL to pretend navigation to.
     * @param callback A callback function receiving two pages as parameters: the page to leave, and the page to open.
     * The latter one is valid only inside callback, as its parameters will be cleaned up right after callback returns.
     * The value returned from callback is then returned from this method call. It may be used to collect some data
     * from target page.
     *
     * @returns Either the value returned by callback, or `undefined` when navigation failed.
     */
    pretend<T>(
        target: Navigation.Target | string | URL,
        callback: (this: void, from: Page, to: Page) => T,
    ): T | undefined;

    /**
     * Pretends navigation to the same page.
     *
     * Prepares navigation and parameters, but does not actually navigate. Instead it calls the provided callback
     * function.
     *
     * This is useful e.g. to build target URL or evaluate target page parameter.
     *
     * @param callback A callback function receiving two pages as parameters: the page to leave, and the page to open.
     * The latter one is valid only inside callback, as its parameters will be cleaned up right after callback returns.
     * The value returned from callback is then returned from this method call. It may be used to collect some data
     * from target page.
     *
     * @returns Either the value returned by callback, or `undefined` when navigation failed.
     */
    pretend<T>(
        callback: (this: void, from: Page, to: Page) => T,
    ): T | undefined;

    /**
     * Pretends navigation and builds navigation target.
     *
     * Prepares navigation and parameters, but does not actually navigate. Instead it calls the provided callback
     * function.
     *
     * This is useful e.g. to build target URL or evaluate target page parameter.
     *
     * @param target  Either navigation target or URL to pretend navigation to. Prepends navigation to current page
     * when omitted.
     *
     * @returns Either Navigation target with URL value, or `undefined` when navigation failed.
     */
    pretend(
        target?: Navigation.Target | string | URL,
    ): URLTarget | undefined;

  }

  /**
   * Navigation target.
   *
   * This is passed to [[Navigation.open]] and [[Navigation.replace]] methods.
   */
  export interface Target {

    /**
     * An URL to update the browser location string to.
     */
    readonly url?: string | URL;

    /**
     * Opaque data to apply to session history. I.e. either push or replace.
     */
    readonly data?: any;

    /**
     * New window title.
     */
    readonly title?: string;

  }

  /**
   * Navigation target with URL value.
   */
  export interface URLTarget extends Target {

    readonly url: URL;

  }

}
