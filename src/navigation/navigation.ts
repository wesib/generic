/**
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import {
  AfterEvent,
  AfterEvent__symbol,
  EventKeeper,
  EventSender,
  OnDomEvent,
  OnEvent,
  OnEvent__symbol,
} from 'fun-events';
import { EnterPageEvent, LeavePageEvent, NavigationEvent, StayOnPageEvent } from './navigation.event';
import { Page } from './page';
import { PageParam } from './page-param';

const Navigation__key = /*#__PURE__*/ new SingleContextKey<Navigation>('navigation');

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
   * The number of element in navigation history.
   */
  abstract readonly length: number;

  /**
   * An `OnDomEvent` registrar of enter page event receivers.
   */
  abstract readonly onEnter: OnDomEvent<EnterPageEvent>;

  /**
   * An `OnDomEvent` registrar of leave page event receivers.
   *
   * These receivers may cancel navigation by calling `preventDefault()` method of received event.
   */
  abstract readonly onLeave: OnDomEvent<LeavePageEvent>;

  /**
   * An `OnDomEvent` registrar of stay on page event receivers.
   *
   * These receivers are informed when navigation has been cancelled by one of leave page event receivers,
   * navigation failed due to e.g. invalid URL, or when another navigation request initiated before the page left.
   */
  abstract readonly onStay: OnDomEvent<StayOnPageEvent>;

  /**
   * An `OnEvent` registrar of navigation events receivers.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  abstract readonly on: OnEvent<[NavigationEvent]>;

  get [OnEvent__symbol](): OnEvent<[NavigationEvent]> {
    return this.on;
  }

  /**
   * An `AfterEvent` registrar of current page receivers.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  abstract readonly read: AfterEvent<[Page]>;

  get [AfterEvent__symbol](): AfterEvent<[Page]> {
    return this.read;
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
   * Replaces the most recent entry in navigation history with the given `target`.
   *
   * @param target  Either navigation target or URL to replace the latest history entry with.
   * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually update the history.
   * Then navigates to the `target`, unless the event cancelled.
   * @fires NavigateEvent@wesib:navigate  On window object when history updated.
   *
   * @returns A promise resolved to navigated page, or to `null` otherwise.
   */
  abstract replace(target: Navigation.Target | string | URL): Promise<Page | null>;

  /**
   * Creates parameterized navigation instance and assigns a page parameter to apply to target page.
   *
   * @typeparam T  Parameter value type.
   * @typeparam I  Parameter input type.
   * @param request  Assigned page parameter request.
   * @param input  Parameter input to use when constructing its value.
   *
   * @returns New parameterized navigation instance.
   */
  abstract with<T, I>(request: PageParam.Request<T, I>, input: I): Navigation.Parameterized;

}

export namespace Navigation {

  /**
   * Parameterized navigation.
   *
   * Allows to assign target page parameters prior to navigating to it.
   */
  export interface Parameterized {

    /**
     * Assigns a page parameter to apply to target page.
     *
     * @typeparam T  Parameter value type.
     * @typeparam I  Parameter input type.
     * @param request  Assigned page parameter request.
     * @param input  Parameter input to use when constructing its value.
     *
     * @returns New parameterized navigation instance.
     */
    with<T, I>(request: PageParam.Request<T, I>, input: I): Parameterized;

    /**
     * Opens a page by navigating to the given `target` with provided page parameters.
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
    open(target: Navigation.Target | string | URL): Promise<Page | null>;

    /**
     * Replaces the most recent entry in navigation history with the given `target` and provided page parameters.
     *
     * @param target  Either navigation target or URL to replace the latest history entry with.
     * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually update the history.
     * Then navigates to the `target`, unless the event cancelled.
     * @fires NavigateEvent@wesib:navigate  On window object when history updated.
     *
     * @returns A promise resolved to navigated page, or to `null` otherwise.
     */
    replace(target: Navigation.Target | string | URL): Promise<Page | null>;

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
