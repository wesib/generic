/**
 * @module @wesib/generic
 */
import { Navigation } from './navigation';

/**
 * Navigation event fired by [[Navigation]] service.
 *
 * @event NavigateEvent#wesib:navigate
 * @typeparam Action  A type of navigation action.
 */
export class NavigateEvent<Action extends NavigateEvent.Action = 'navigate' | 'replace' | 'return'> extends Event {

  /**
   * Navigation action passed to constructor.
   */
  readonly action: Action;

  /**
   * Source location.
   */
  readonly from: Navigation.Location;

  /**
   * Navigation target.
   */
  readonly to: Navigation.URLTarget;

  /**
   * Constructs navigation event.
   *
   * @param type  Event type.
   * @param init  Initialization options.
   */
  constructor(
      type: string,
      init: NavigateEvent.Init<Action>,
  ) {
    super(type, { ...init, cancelable: type === 'wesib:preNavigate' && init.action.substring(0, 4) === 'pre-' });
    this.action = init.action;
    this.from = init.from;
    this.to = init.to;
  }

}

/**
 * Pre-navigation event fired prior to actual navigation or navigation history update.
 *
 * This event can be cancelled in order to prevent the actual navigation or history update. The navigation is also
 * cancelled when another navigation initiated by one of this event handlers.
 *
 * @event NavigateEvent#wesib:preNavigate
 * @event NavigateEvent#wesib:dontNavigate
 */
export type PreNavigateEvent = NavigateEvent<'pre-navigate' | 'pre-replace'>;

export namespace NavigateEvent {

  /**
   * An action of navigation event.
   *
   * One of:
   * - `pre-navigate` - An event fired prior to {@link Navigation.navigate navigate}.
   *   Cancelling such event prevents navigation.
   * - `navigate` - An event fired when navigation succeed.
   * - `pre-replace` - An event fired prior to {@link Navigation.replace navigation history update}.
   *   Cancelling such event prevents the update.
   * - `replace` - An event fired when navigation history updated.
   * - `return` - An event fired when returned navigated to previously visited entry in navigation history.
   */
  export type Action = 'pre-navigate' | 'pre-replace' | 'navigate' | 'replace' | 'return';

  /**
   * Navigation event initialization options.
   *
   * Contains mandatory navigation `action` and all event init options except `cancelable`.
   */
  export interface Init<A extends Action> extends Omit<EventInit, 'cancelable'> {

    /**
     * Navigation action.
     *
     * When started with `pre-` the initialized event is cancelable.
     */
    readonly action: A;

    /**
     * Source location.
     */
    readonly from: Navigation.Location;

    /**
     * Navigation target.
     */
    readonly to: Navigation.URLTarget;

  }

}
