import { Share } from './share';

/**
 * A reference to {@link Share component share}.
 *
 * @typeParam T - Shared value type.
 */
export interface ShareRef<T> {
  /**
   * Component share instance.
   */
  readonly share: Share<T>;
}
