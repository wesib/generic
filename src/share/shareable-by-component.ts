import { Contextual, Contextual__symbol } from '@proc7ts/context-values';
import { noop, valueProvider, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';

const ShareableByComponent$internals = (/*#__PURE__*/ Symbol('ShareableByComponent.internals'));

/**
 * Abstract implementation of value shareable by component.
 *
 * Shareable instance contains {@link internals} that become usable only when bound to sharer component.
 *
 * @typeParam TSharer - Sharer component type.
 * @typeParam TInternals - Internals data type.
 */
export abstract class ShareableByComponent<TSharer extends object = any, TInternals = unknown>
    implements Contextual<ShareableByComponent<TSharer, TInternals>> {

  /**
   * @internal
   */
  private [ShareableByComponent$internals]: ShareableByComponent$Internals<TSharer, TInternals>;

  /**
   * Constructs shareable instance.
   *
   * @param internals - Either shareable internals, or their provider.
   */
  protected constructor(internals: TInternals | ShareableByComponent.Provider<TSharer, TInternals>) {
    this[ShareableByComponent$internals] = new ShareableByComponent$Internals(this, internals);
  }

  /**
   * Binds this shareable instance to sharer component.
   *
   * @param sharer - Sharer component context.
   *
   * @returns `this` instance.
   */
  [Contextual__symbol](sharer: ComponentContext): this {
    this[ShareableByComponent$internals].bind(sharer);
    return this;
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

class ShareableByComponent$Internals<TSharer extends object, TInternals> {

  private readonly _get: ShareableByComponent.Provider<TSharer, TInternals>;

  constructor(
      private readonly _source: ShareableByComponent<TSharer, TInternals>,
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
