import { ComponentContext } from '@wesib/wesib';

/**
 * An interface to implement by shared value to be aware of its sharer component.
 */
export interface SharerAware {

  /**
   * Informs this shared value on its sharer component.
   *
   * @param sharer - Sharer component context.
   */
  sharedBy(sharer: ComponentContext): void;

}

/**
 * Checks whether the given value is {@link SharerAware aware} of its sharer.
 *
 * @param value - A value to check.
 *
 * @returns `true` if `value` has {@link SharerAware.sharedBy sharedBy} method, or `false` otherwise.
 */
export function isSharerAware(value: unknown): value is SharerAware {
  return (typeof value === 'object' && !!value || typeof value === 'function')
      && typeof (value as Partial<SharerAware>).sharedBy === 'function';
}

/**
 * Informs the given value on its sharer.
 *
 * Does nothing if the `value` is not {@link SharerAware aware} of its sharer.
 *
 * @param sharer - Sharer component context.
 * @param value - Shared value.
 *
 * @returns The `value` itself.
 */
export function shareValueBy<T>(sharer: ComponentContext, value: T): T {
  if (isSharerAware(value)) {
    value.sharedBy(sharer);
  }

  return value;
}
