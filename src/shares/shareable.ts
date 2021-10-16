import {
  AfterEvent,
  AfterEvent__symbol,
  afterValue,
  EventKeeper,
  trackValueBy,
  ValueTracker,
} from '@proc7ts/fun-events';
import { noop, valueProvider, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { SharerAware } from './sharer-aware';

const Shareable$Internals__symbol = (/*#__PURE__*/ Symbol('Shareable.internals'));

/**
 * Abstract implementation of value shareable by component.
 *
 * Shareable instance contains a {@link body} that become usable only when bound to sharer component.
 *
 * @typeParam TBody - Shareable body type.
 * @typeParam TSharer - Sharer component type.
 */
export class Shareable<TBody = unknown, TSharer extends object = any>
    implements EventKeeper<[TBody]>, SharerAware {

  /**
   * Converts shareable body or its provider to provider that always returns an `AfterEvent` keeper of shareable body.
   *
   * @typeParam TBody - Shareable body type.
   * @typeParam TSharer - Sharer component type.
   * @param body - Either shareable body, or its provider.
   *
   * @returns Shareable body provider.
   */
  static provider<TBody = unknown, TSharer extends object = any>(
      body: TBody | Shareable.Provider<TBody, TSharer>,
  ): (
      this: void,
      sharer: ComponentContext<TSharer>,
  ) => AfterEvent<[TBody]> {

    const provider = valueRecipe(body);

    return context => afterValue(provider(context));
  }

  /**
   * @internal
   */
  private [Shareable$Internals__symbol]: Shareable$Internals<TBody, TSharer>;

  /**
   * Constructs shareable instance.
   *
   * @param body - Either shareable body, or its provider.
   */
  constructor(body: TBody | Shareable.Provider<TBody, TSharer>) {
    this[Shareable$Internals__symbol] = new Shareable$Internals(this, body);
  }

  /**
   * Sharer component context.
   *
   * Accessing it throws an exception until bound to sharer.
   */
  get sharer(): ComponentContext<TSharer> {
    return this[Shareable$Internals__symbol].sharer();
  }

  /**
   * An `AfterEvent` keeper of shareable body.
   *
   * An `[AfterEvent__symbol]` method always returns this value.
   */
  get read(): AfterEvent<[TBody]> {
    return this[Shareable$Internals__symbol].get().read;
  }

  /**
   * Informs this shareable instance on its sharer component.
   *
   * @param sharer - Sharer component context.
   */
  sharedBy(sharer: ComponentContext<TSharer>): void {
    this[Shareable$Internals__symbol].sharedBy(sharer);
  }

  [AfterEvent__symbol](): AfterEvent<[TBody]> {
    return this.read;
  }

  /**
   * Shareable body.
   *
   * Accessing is throws an exception until bound to sharer.
   */
  get body(): TBody {
    return this[Shareable$Internals__symbol].get().it;
  }

}

export namespace Shareable {

  /**
   * Shareable provider signature.
   *
   * Provides shareable body rather the shareable instance itself.
   *
   * @typeParam TBody - Shareable body type.
   * @typeParam TSharer - Sharer component type.
   */
  export type Provider<TBody = unknown, TSharer extends object = any> =
  /**
   * @param sharer - Sharer component context.
   *
   * @returns Either shareable body instance, or an `AfterEvent` keeper reporting one.
   */
      (
          this: void,
          sharer: ComponentContext<TSharer>,
      ) => TBody | AfterEvent<[TBody]>;

}

class Shareable$Internals<TBody, TSharer extends object> {

  private readonly _get: (
      this: void,
      sharer: ComponentContext<TSharer>,
  ) => AfterEvent<[TBody]>;

  constructor(
      private readonly _source: Shareable<TBody, TSharer>,
      body: TBody | Shareable.Provider<TBody, TSharer>,
  ) {
    this._get = Shareable.provider(body);
  }

  sharer(): ComponentContext<TSharer> {
    this._notBound();
  }

  get(): ValueTracker<TBody> {
    this._notBound();
  }

  sharedBy(sharer: ComponentContext<TSharer>): void {
    this.sharedBy = noop;
    this.sharer = valueProvider(sharer);
    this.get = () => {

      const tracker = trackValueBy(this._get(sharer));

      this.get = valueProvider(tracker);

      return tracker;
    };
  }

  private _notBound(): never {
    throw new TypeError(`${String(this._source)} is not properly shared yet`);
  }

}
