import { ShareRef } from './share-ref';

/**
 * A specifier of component share to share the value of.
 *
 * @typeParam T - Shared value type.
 */
export interface TargetShare<T> {
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
  readonly local?: boolean | undefined;
}
