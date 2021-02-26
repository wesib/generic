import { isShareRef, ShareRef } from './share-ref';

/**
 * A specifier of component share to share the value of.
 *
 * Can be one of:
 *
 * - component share {@link ShareRef reference}, or
 * - detailed target component share {@link TargetShare.Spec specifier}.
 *
 * @typeParam T - Shared value type.
 */
export type TargetShare<T> =
    | ShareRef<T>
    | TargetShare.Spec<T>;

export namespace TargetShare {

  /**
   * A detailed specifier of the component share to share the value of.
   *
   * @typeParam T - Shared value type.
   */
  export interface Spec<T> {

    /**
     * Target component share reference.
     */
    readonly share: ShareRef<T>;

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
 * Converts arbitrary {@link TargetShare target component share} to its detailed {@link TargetShare.Spec specifier}.
 *
 * @typeParam T - Share value type.
 * @param target
 */
export function targetShare<T>(target: TargetShare<T>): TargetShare.Spec<T> {
  return isShareRef(target) ? { share: target } : target;
}
