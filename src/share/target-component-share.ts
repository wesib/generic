import { ComponentShareRef } from './component-share-ref';

/**
 * A component share to share the value of.
 *
 * Can be one of:
 *
 * - component share {@link ComponentShareRef reference}, or
 * - detailed target component share {@link TargetComponentShare.Spec specifier}.
 */
export type TargetComponentShare<T> =
    | ComponentShareRef<T>
    | TargetComponentShare.Spec<T>;

export namespace TargetComponentShare {

  /**
   * A detailed specifier of the component share to share the value of.
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
