import { ComponentShareRef, isComponentShareRef } from './component-share-ref';

/**
 * A specifier of component share to share the value of.
 *
 * Can be one of:
 *
 * - component share {@link ComponentShareRef reference}, or
 * - detailed target component share {@link TargetComponentShare.Spec specifier}.
 *
 * @typeParam T - Shared value type.
 */
export type TargetComponentShare<T> =
    | ComponentShareRef<T>
    | TargetComponentShare.Spec<T>;

export namespace TargetComponentShare {

  /**
   * A detailed specifier of the component share to share the value of.
   *
   * @typeParam T - Shared value type.
   */
  export interface Spec<T> {

    /**
     * Target component share reference.
     */
    readonly share: ComponentShareRef<T>;

    /**
     * Whether to share is local.
     *
     * - `true` to make the value available only locally, i.e. only when requested by sharer context.
     * - `false` (by default) to make the value available to nested components too.
     */
    readonly local?: boolean;

  }

}

/**
 * Converts arbitrary {@link TargetComponentShare target component share} to its detailed
 * {@link TargetComponentShare.Spec specifier}.
 *
 * @typeParam T - Share value type.
 * @param target
 */
export function targetComponentShare<T>(target: TargetComponentShare<T>): TargetComponentShare.Spec<T> {
  return isComponentShareRef(target) ? { share: target } : target;
}
