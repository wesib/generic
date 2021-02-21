import { ComponentShare } from './component-share';

/**
 * A key of {@link ComponentShareRef component share reference} property containing a {@link ComponentShare component
 * share} instance.
 */
export const ComponentShare__symbol = (/*#__PURE__*/ Symbol('ComponentShare'));

/**
 * A reference to {@link ComponentShare component share}.
 *
 * @typeParam T - Shared value type.
 */
export interface ComponentShareRef<T> {

  /**
   * Component share instance.
   */
  readonly [ComponentShare__symbol]: ComponentShare<T>;

}

/**
 * Checks whether the given value is a {@link ComponentShareRef component share reference}.
 *
 * @typeParam T - Shared value type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the value has a {@link ComponentShare__symbol} property, or `false` otherwise.
 */
export function isComponentShareRef<T, TOther>(value: ComponentShareRef<T> | TOther): value is ComponentShareRef<T> {
  return !!value
      && (typeof value === 'object' || typeof value === 'function')
      && !!(value as Partial<ComponentShareRef<T>>)[ComponentShare__symbol];
}
