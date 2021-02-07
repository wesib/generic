import { noop, valueProvider, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';

const ShareableByComponent$internals = (/*#__PURE__*/ Symbol('ShareableByComponent.internals'));

/**
 * Abstract implementation of value shareable by component.
 *
 * Shareable instance contains {@link internals} that become usable only when {@link shareBy bound to sharer
 * component}. An {@link AbstractComponentShare} takes care of such binding.
 *
 * @typeParam T - Shareable value type. Expected to be implemented by inherited class.
 * @typeParam TSharer - Sharer component type.
 * @typeParam TInternals - Internals data type.
 */
export abstract class ShareableByComponent<
    T extends ShareableByComponent<T, TSharer, TInternals>,
    TSharer extends object = any,
    TInternals = unknown> {

  /**
   * @internal
   */
  private [ShareableByComponent$internals]: ShareableByComponent$Internals<T, TSharer, TInternals>;

  /**
   * Constructs shareable instance.
   *
   * @param internals - Either shareable internals, or their provider.
   */
  protected constructor(internals: TInternals | ShareableByComponent.Provider<TSharer, TInternals>) {
    this[ShareableByComponent$internals] = new ShareableByComponent$Internals(this, internals);
  }

  /**
   * Binds shareable instance to sharer component.
   *
   * @param sharer - Sharer component context.
   *
   * @returns A value to share. `this` instance by default.
   */
  shareBy(sharer: ComponentContext): T {
    this[ShareableByComponent$internals].bind(sharer);
    return this as unknown as T;
  }

  /**
   * Shareable internals.
   *
   * Accessing these internals throws an exception until {@link shareBy bound to sharer}.
   */
  protected get internals(): TInternals {
    return this[ShareableByComponent$internals].get();
  }

}

export namespace ShareableByComponent {

  /**
   * Shareable provider signature.
   *
   * Provides shareable internals rather the shareable instance itself.
   *
   * @typeParam T - Shareable value type.
   * @typeParam TSharer - Sharer component type.
   * @typeParam TInternals - Internals data type.
   */
  export type Provider<TSharer extends object = any, TInternals = unknown> =
  /**
   * @param sharer - Sharer component context.
   *
   * @returns Shareable internals.
   */
      (
          this: void,
          sharer: ComponentContext<TSharer>,
      ) => TInternals;

}

class ShareableByComponent$Internals<
    T extends ShareableByComponent<T, TSharer, TInternals>,
    TSharer extends object,
    TInternals> {

  private readonly _get: ShareableByComponent.Provider<TSharer, TInternals>;

  constructor(
      private readonly _source: ShareableByComponent<T, TSharer, TInternals>,
      internals: TInternals | ShareableByComponent.Provider<TSharer, TInternals>,
  ) {
    this._get = valueRecipe<TInternals, [ComponentContext]>(internals);
  }

  get(): TInternals {
    throw new TypeError(`${String(this._source)} is not properly shared yet`);
  }

  bind(sharer: ComponentContext<TSharer>): void {
    this.bind = noop;
    this.get = () => {

      const control = this._get(sharer);

      this.get = valueProvider(control);

      return control;
    };
  }

}
