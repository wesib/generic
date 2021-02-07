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
