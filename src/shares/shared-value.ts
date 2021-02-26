import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { AfterEvent } from '@proc7ts/fun-events';
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { ShareRef } from './share-ref';

/**
 * A key of the {@link SharedValue.Detailed detailed shared value descriptor} containing the
 * {@link SharedValue.Details shared value details}.
 */
export const SharedValue__symbol = (/*#__PURE__*/ Symbol('SharedValue'));

/**
 * A value shared by component.
 *
 * Either a pure value, or its {@link SharedValue.Detailed detailed descriptor}.
 *
 * @typeParam T - Shared value type.
 */
export type SharedValue<T> = T | SharedValue.Detailed<T>;

export namespace SharedValue {

  /**
   * Value sharing options.
   *
   * Declare availability of the shared value.
   */
  export interface Options {

    /**
     * The name of the element the sharer component is bound to. Defaults to component's element name.
     *
     * Ignored for {@link local} shares
     */
    readonly name?: QualifiedName;

    /**
     * Whether the share is local.
     *
     * - `true` to make the value available only locally, i.e. only when requested by sharer context.
     * - `false` (by default) to make the value available to nested components too.
     */
    readonly local?: boolean;

  }

  /**
   * A detailed descriptor of the value shared by component.
   *
   * @typeParam T - Shared value type.
   */
  export interface Detailed<T> {

    /**
     * Shared value details.
     */
    readonly [SharedValue__symbol]: Details<T>;

  }

  /**
   * Details of the shared value.
   */
  export interface Details<T> {

    /**
     * A priority of the shared value.
     *
     * Never negative. The lesser value means higher priority. The shared value with higher priority
     * {@link Share.selectValue takes precedence}.
     */
    readonly priority: number;

    /**
     * Builds the shared value.
     *
     * @returns Either the shared value, or its `AfterEvent` keeper.
     */
    get(): T | AfterEvent<[T?]>;

  }

  /**
   * Shared value registrar.
   *
   * Passed to {@link Share.shareValue} method in order to share the value.
   *
   * @typeParam T - Shared value type.
   */
  export interface Registrar<T> extends SupplyPeer {

    /**
     * The default priority of the shared value.
     *
     * Never negative.
     */
    readonly priority: number;

    /**
     * Shared value supply.
     *
     * Stops value sharing once cut off.
     */
    readonly supply: Supply;

    /**
     * Shares the value under the given alias.
     *
     * @param alias - A reference to share alias.
     * @param priority - Shared value priority. Equals to {@link priority default one} when omitted.
     */
    shareAs(this: void, alias: ShareRef<T>, priority?: number): void;

    /**
     * Builds a shared value registrar instance with another default priority.
     *
     * @param priority - New default shared value priority.
     *
     * @returns New registrar instance with {@link priority} set to the given value.
     */
    withPriority(this: void, priority: number): Registrar<T>;

  }

  /**
   * Shared value provider.
   *
   * Can be used to {@link Share.createRegistrar create} a {@link SharedValue.Registrar} instance.
   *
   * @typeParam TSharer - Supported sharer component type.
   * @typeParam T - Shared value type.
   */
  export interface Provider<T, TSharer extends object = any> {

    /**
     * The default priority of the shared value.
     *
     * Equals to `0` when absent or negative.
     */
    readonly priority?: number;

    /**
     * Shared value supply.
     *
     * Stops value sharing once cut off.
     *
     * New supply instance will be created when absent.
     */
    readonly supply?: Supply;

    /**
     * Provides shared value for the given component context.
     *
     * @typeParam TComponent - Actual sharer component type.
     * @param context - Sharer component context to provide value for.
     *
     * @returns Either a shared value, or its `AfterEvent` keeper.
     */
    provide<TComponent extends TSharer>(context: ComponentContext<TComponent>): T | AfterEvent<[T?]>;

  }

}

export const SharedValue = {

  /**
   * Checks whether the given value shared by component is has details.
   *
   * @typeParam T - Shared value type.
   * @param value - Shared value to check.
   *
   * @returns `true` if the given value is an object implementing a {@link SharedValue.Detailed} interface.
   */
  hasDetails<T>(
      this: void,
      value: SharedValue<T>,
  ): value is SharedValue.Detailed<T> {
    return !!value
        && typeof value === 'object'
        && typeof (value as SharedValue.Detailed<T>)[SharedValue__symbol] === 'object';
  },

};
