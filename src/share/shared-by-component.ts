import { EventKeeper } from '@proc7ts/fun-events';
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { ComponentShareRef } from './component-share-ref';

/**
 * A key of the {@link SharedByComponent.Detailed detailed shared value descriptor} containing the
 * {@link SharedByComponent.Details shared value details}.
 */
export const SharedByComponent__symbol = (/*#__PURE__*/ Symbol('SharedByComponent'));

/**
 * A value shared by component.
 *
 * Either a pure value, or its {@link SharedByComponent.Detailed detailed descriptor}.
 *
 * @typeParam T - Shared value type.
 */
export type SharedByComponent<T> = T | SharedByComponent.Detailed<T>;

export namespace SharedByComponent {

  /**
   * A detailed descriptor of the value shared by component.
   *
   * @typeParam T - Shared value type.
   */
  export interface Detailed<T> {

    /**
     * Shared value details.
     */
    readonly [SharedByComponent__symbol]: Details<T>;

  }

  /**
   * Details of the shared value.
   */
  export interface Details<T> {

    /**
     * A priority of the shared value.
     *
     * Never negative. The lesser value means higher priority. The shared value with higher priority
     * {@link ComponentShare.selectValue takes precedence}.
     */
    readonly priority: number;

    /**
     * Builds the shared value.
     *
     * @returns Either the shared value, or its `EventKeeper`.
     */
    get(): T | EventKeeper<[T?]>;

  }

  /**
   * Shared value registrar.
   *
   * Passed to {@link ComponentShare.shareValue} method in order to share the value.
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
    shareAs(this: void, alias: ComponentShareRef<T>, priority?: number): void;

    /**
     * Builds a shared value registrar instance with another default priority.
     *
     * @param priority - New default shared value priority.
     *
     * @returns New registrar instance with {@link priority} set to the given value.
     */
    withPriority(this: void, priority: number): Registrar<T>;

  }

}

export const SharedByComponent = {

  /**
   * Checks whether the given value shared by component is has details.
   *
   * @typeParam T - Shared value type.
   * @param value - Shared value to check.
   *
   * @returns `true` if the given value is an object implementing a {@link SharedByComponent.Detailed} interface.
   */
  hasDetails<T>(
      this: void,
      value: SharedByComponent<T>,
  ): value is SharedByComponent.Detailed<T> {
    return !!value
        && typeof value === 'object'
        && typeof (value as SharedByComponent.Detailed<T>)[SharedByComponent__symbol] === 'object';
  },

};
