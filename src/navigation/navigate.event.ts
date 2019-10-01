/**
 * @module @wesib/generic
 */
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

  private readonly _from: string;

  private readonly _to: string;

  /**
   * Source URL.
   */
  get from(): URL {
    return new URL(this._from);
  }

  /**
   * Target URL.
   */
  get to(): URL {
    return new URL(this._to);
  }

  /**
   * Old navigation history entry data.
   */
  readonly oldData: any;

  /**
   * New navigation history entry data.
   */
  readonly newData: any;

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
    this._from = init.from.toString();
    this._to = init.to.toString();
    this.oldData = init.oldData;
    this.newData = init.newData;
  }

}

/**
 * Pre-navigation event fired prior to actual navigation or navigation history update.
 *
 * This event can be cancelled in order to prevent the actual navigation or history update.
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
     * Source URL.
     */
    readonly from: URL;

    /**
     * Target URL.
     */
    readonly to: URL;

    /**
     * Old navigation history entry data.
     */
    readonly oldData?: any;

    /**
     * New navigation history entry data.
     */
    readonly newData?: any;

  }

}
