/**
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, AfterEvent__symbol, EventKeeper, OnDomEvent } from 'fun-events';
import { NavigateEvent, PreNavigateEvent } from './navigate.event';

const Navigation__key = /*#__PURE__*/ new SingleContextKey<Navigation>('navigation');

/**
 * Browser navigation service.
 *
 * Expected to be used as a [History] and [Location] APIs replacement.
 *
 * Fires additional navigation events the browser does not support natively.
 *
 * Implements an `EventKeeper` interface by sending current navigation locations to registered receivers.
 *
 * Available as bootstrap context value when [[NavigationSupport]] feature is enabled.
 *
 * [History]: https://developer.mozilla.org/en-US/docs/Web/API/History
 * [Location]: https://developer.mozilla.org/en-US/docs/Web/API/Location
 */
export abstract class Navigation implements EventKeeper<[Navigation.Location]> {

  static get [ContextKey__symbol](): ContextKey<Navigation> {
    return Navigation__key;
  }

  /**
   * The number of element in navigation history.
   */
  abstract readonly length: number;

  /**
   * An `OnDomEvent` registrar of pre-navigation event receivers.
   *
   * These receivers may cancel navigation by calling `preventDefault()` method of received event.
   */
  abstract readonly preNavigate: OnDomEvent<PreNavigateEvent>;

  /**
   * An `OnDomEvent` registrar of navigation event receivers.
   */
  abstract readonly onNavigate: OnDomEvent<NavigateEvent>;

  /**
   * An `OnDomEvent` registrar of navigation cancellation event receivers.
   *
   * These receivers are informed when navigation has been cancelled by one of pre-navigation event receivers,
   * or navigation failed due to e.g. invalid URL.
   */
  abstract readonly dontNavigate: OnDomEvent<PreNavigateEvent>;

  /**
   * An `AfterEvent` registrar of navigation location receivers.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  abstract readonly read: AfterEvent<[Navigation.Location]>;

  get [AfterEvent__symbol](): AfterEvent<[Navigation.Location]> {
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
   * Navigates to the given navigation `target`.
   *
   * Appends an entry to navigation history.
   *
   * @param target  Either navigation target or URL to navigate to.
   * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually navigate.
   * Then navigates to the `target`, unless the event cancelled.
   * @fires NavigateEvent@wesib:navigate  On window object when navigation succeed.
   *
   * @returns A promise resolved to `true` if navigated successfully, or to `false` otherwise.
   */
  abstract navigate(target: Navigation.Target | string | URL): Promise<boolean>;

  /**
   * Updates the most recent entry of navigation history.
   *
   * @param target  Either navigation target or URL to replace the latest history entry with.
   * @fires PreNavigateEvent#wesib:preNavigate  On window object prior to actually update the history.
   * Then navigates to the `target`, unless the event cancelled.
   * @fires NavigateEvent@wesib:navigate  On window object when history updated.
   *
   * @returns A promise resolved to `true` if navigation history updated, or to `false` otherwise.
   */
  abstract replace(target: Navigation.Target | string | URL): Promise<boolean>;

}

export namespace Navigation {

  /**
   * Navigation target.
   *
   * This is passed to [[Navigation.assign]] and [[Navigation.replace]] methods.
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
   * Navigation location. Represents navigation history entry.
   */
  export interface Location {

    /**
     * Current page location URL.
     */
    readonly url: URL;

    /**
     * Current history entry data.
     */
    readonly data?: any;

  }

}
