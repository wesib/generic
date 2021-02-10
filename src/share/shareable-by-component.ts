import { noop, valueProvider, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';

/**
 * A key of the method of {@link ShareableByComponent.Base shareable value} that bounds the value to component context.
 */
export const ShareableByComponent__symbol = (/*#__PURE__*/ Symbol('ShareableByComponent'));

const ShareableByComponent$internals = (/*#__PURE__*/ Symbol('ShareableByComponent.internals'));

/**
 * Abstract implementation of value shareable by component.
 *
 * Shareable instance contains {@link internals} that become usable only when {@link ComponentShare.bindValue bound to
 * sharer component}.
 *
 * @typeParam T - Shared value type. Expected to be implemented by shareable instance.
 * @typeParam TSharer - Sharer component type.
 * @typeParam TInternals - Internals data type.
 */
export abstract class ShareableByComponent<
    T extends ShareableByComponent<T, TSharer, TInternals>,
    TSharer extends object = any,
    TInternals = unknown>
    implements ShareableByComponent.Base<T> {

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

  [ShareableByComponent__symbol](sharer: ComponentContext): T {
    this[ShareableByComponent$internals].bind(sharer);
    return this as unknown as T;
  }

  /**
   * Shareable internals.
   *
   * Accessing these internals throws an exception until bound to sharer.
   */
  protected get internals(): TInternals {
    return this[ShareableByComponent$internals].get();
  }

}

export namespace ShareableByComponent {

  /**
   * Base interface of {@link ShareableByComponent shareable by component} instance.
   *
   * @typeParam T - Shared value type. Expected to be implemented by shareable instance.
   * is assignable from shareable instance one.
   */
  export interface Base<T> {

    /**
     * Binds this shareable instance to sharer component.
     *
     * This method is called automatically by {@link ComponentShare.bindValue component share} if shared instance
     * implements this interface.
     *
     * @param sharer - Sharer component context.
     *
     * @returns A value to share. `this` instance by default.
     */
    [ShareableByComponent__symbol](sharer: ComponentContext): T;

  }

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

/**
 * Checks whether the given value is {@link ShareableByComponent.Base shareable by component}.
 *
 * @typeParam T - Shared value type.
 * @typeParam TOther - Other value type.
 * @param value - The value to check.
 *
 * @returns `true` is `value` contains a {@link ShareableByComponent__symbol} method.
 */
export function isShareableByComponent<T, TOther = unknown>(
    value: ShareableByComponent.Base<T> | TOther,
): value is ShareableByComponent.Base<T> {
  return !!value
      && (typeof value === 'object' || typeof value === 'function')
      && typeof (value as Partial<ShareableByComponent.Base<T>>)[ShareableByComponent__symbol] === 'function';
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
