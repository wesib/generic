import { Contextual, Contextual__symbol } from '@proc7ts/context-values';
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

const Shareable$Internals__symbol = (/*#__PURE__*/ Symbol('Shareable.internals'));

/**
 * Abstract implementation of value shareable by component.
 *
 * Shareable instance contains {@link internals} that become usable only when bound to sharer component.
 *
 * @typeParam TInternals - Internals data type.
 * @typeParam TSharer - Sharer component type.
 */
export abstract class Shareable<TInternals = unknown, TSharer extends object = any>
    implements EventKeeper<[TInternals]>, Contextual<Shareable<TInternals, TSharer>> {

  /**
   * Converts shareable internals or their provider to provider that always returns an `AfterEvent` keeper of
   * shareable internals.
   *
   * @param internals - Either shareable internals, or their provider.
   *
   * @returns Shareable internals provider.
   */
  static provider<TInternals = unknown, TSharer extends object = any>(
      internals: TInternals | Shareable.Provider<TInternals, TSharer>,
  ): (
      this: void,
      sharer: ComponentContext<TSharer>,
  ) => AfterEvent<[TInternals]> {

    const provider = valueRecipe(internals);

    return context => afterValue(provider(context));
  }

  /**
   * @internal
   */
  private [Shareable$Internals__symbol]: Shareable$Internals<TInternals, TSharer>;

  /**
   * Constructs shareable instance.
   *
   * @param internals - Either shareable internals, or their provider.
   */
  constructor(internals: TInternals | Shareable.Provider<TInternals, TSharer>) {
    this[Shareable$Internals__symbol] = new Shareable$Internals(this, internals);
  }

  get sharer(): ComponentContext<TSharer> {
    return this[Shareable$Internals__symbol].sharer();
  }

  /**
   * Binds this shareable instance to sharer component.
   *
   * @param sharer - Sharer component context.
   *
   * @returns `this` instance.
   */
  [Contextual__symbol](sharer: ComponentContext): this {
    this[Shareable$Internals__symbol].bind(sharer);
    return this;
  }

  [AfterEvent__symbol](): AfterEvent<[TInternals]> {
    return this[Shareable$Internals__symbol].get().read;
  }

  /**
   * Shareable internals.
   *
   * Accessing these internals throws an exception until bound to sharer.
   */
  protected get internals(): TInternals {
    return this[Shareable$Internals__symbol].get().it;
  }

}

export namespace Shareable {

  /**
   * Shareable provider signature.
   *
   * Provides shareable internals rather the shareable instance itself.
   *
   * @typeParam TInternals - Internals data type.
   * @typeParam TSharer - Sharer component type.
   */
  export type Provider<TInternals = unknown, TSharer extends object = any> =
  /**
   * @param sharer - Sharer component context.
   *
   * @returns Either shareable internals instance, or an `AfterEvent` keeper reporting one.
   */
      (
          this: void,
          sharer: ComponentContext<TSharer>,
      ) => TInternals | AfterEvent<[TInternals]>;

}

class Shareable$Internals<TInternals, TSharer extends object> {

  private readonly _get: (
      this: void,
      sharer: ComponentContext<TSharer>,
  ) => AfterEvent<[TInternals]>;

  constructor(
      private readonly _source: Shareable<TInternals, TSharer>,
      internals: TInternals | Shareable.Provider<TInternals, TSharer>,
  ) {
    this._get = Shareable.provider(internals);
  }

  sharer(): ComponentContext<TSharer> {
    this._notBound();
  }

  get(): ValueTracker<TInternals> {
    this._notBound();
  }

  bind(sharer: ComponentContext<TSharer>): void {
    this.bind = noop;
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
