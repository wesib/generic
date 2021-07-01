import { Share } from './share';

/**
 * A key of {@link ShareRef component share reference} property containing a {@link Share component share} instance.
 */
export const Share__symbol = (/*#__PURE__*/ Symbol('Share'));

/**
 * A reference to {@link Share component share}.
 *
 * @typeParam T - Shared value type.
 */
export interface ShareRef<T> {

  /**
   * Component share instance.
   */
  readonly [Share__symbol]: Share<T>;

}

/**
 * Checks whether the given value is a {@link ShareRef component share reference}.
 *
 * @typeParam T - Shared value type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the value has a {@link Share__symbol} property, or `false` otherwise.
 */
export function isShareRef<T, TOther>(value: ShareRef<T> | TOther): value is ShareRef<T> {
  return !!value
      && (typeof value === 'object' || typeof value === 'function')
      && !!(value as Partial<ShareRef<T>>)[Share__symbol];
}
