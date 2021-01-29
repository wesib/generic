import { EventKeeper } from '@proc7ts/fun-events';

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
     * The order of the shared value.
     *
     * The values with lesser order are {@link ComponentShare.selectValue preferred}.
     */
    readonly order: number;

    /**
     * Builds the shared value.
     *
     * @returns Either the shared value, or its `EventKeeper`.
     */
    get(): T | EventKeeper<[T] | []>;

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
