import { nodeHost } from '@frontmeans/dom-primitives';
import { AfterEvent } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { ShareRef } from './share-ref';

/**
 * Shared value locator.
 *
 * Can be one of:
 *
 * - shared value locator specified {@link ShareLocator.Spec},
 * - {@link ShareLocator.CustomWithFallback custom} shared value locator, or
 * - `null`/`undefined` to locate a fallback share.
 *
 * A {@link shareLocator} function can be used to convert arbitrary locator to a function.
 *
 * @typeParam T - Shared value type.
 */
export type ShareLocator<T> =
    | ShareLocator.Spec<T>
    | ShareLocator.CustomWithFallback<T>
    | null
    | undefined;

/**
 * Converts mandatory shared value locator to locator function.
 *
 * @typeParam T - Shared value type.
 * @param locator - Shared value locator to convert.
 * @param defaultOptions - Default shared value locator options.
 *
 * @returns Shared value locator function.
 */
export function shareLocator<T>(
    locator: ShareLocator.Mandatory<T>,
    defaultOptions?: ShareLocator.Options,
): ShareLocator.Fn<T>;

/**
 * Converts arbitrary shared value locator to locator function.
 *
 * @typeParam T - Shared value type.
 * @param locator - Shared value locator to convert.
 * @param defaultSpec - Default shared value locator specifier including fallback share reference.
 *
 * @returns Shared value locator function.
 */
export function shareLocator<T>(
    locator: ShareLocator<T>,
    defaultSpec: ShareLocator.MandatorySpec<T>,
): ShareLocator.Fn<T>;

export function shareLocator<T>(
    locator:
        | Partial<ShareLocator.MandatorySpec<T>>
        | ShareLocator.CustomWithFallback<T>
        | null
        | undefined,
    defaultSpec: ShareLocator.Spec<T> = {},
): ShareLocator.Fn<T> {
  if (isCustomShareLocator(locator)) {

    const {
      host: hostByDefault = nodeHost,
      local: localByDefault = false,
      share: shareByDefault,
    } = defaultSpec;

    return (consumer, options = {}) => {

      const {
        share = shareByDefault!,
        host = hostByDefault,
        local = localByDefault,
      } = options;

      return locator(consumer, { share, host, local });
    };
  }

  const {
    share: shareRef = defaultSpec.share!,
    host: hostByDefault = defaultSpec.host,
    local: localByDefault = defaultSpec.local,
  } = locator || {};
  const share = shareRef.share;

  return (consumer, options = {}) => {

    const { host = hostByDefault, local = localByDefault } = options;

    return share.valueFor(consumer, { host, local });
  };
}

function isCustomShareLocator<T>(locator:
    | Partial<ShareLocator.MandatorySpec<T>>
    | ShareLocator.CustomWithFallback<T>
    | null
    | undefined): locator is ShareLocator.CustomWithFallback<T> {
  return typeof locator === 'function' && !('share' in locator as Partial<ShareLocator.Spec<T>>);
}

export namespace ShareLocator {

  /**
   * Mandatory shared value locator.
   *
   * Can be one of:
   *
   * - component share {@link ShareRef reference},
   * - shared value locator specified {@link ShareLocator.Spec}, or
   * - {@link ShareLocator.Custom custom} shared value locator.
   *
   * A {@link shareLocator} function can be used to convert arbitrary locator to a function.
   *
   * @typeParam T - Shared value type.
   */
  export type Mandatory<T> =
      | ShareRef<T>
      | MandatorySpec<T>
      | Custom<T>;

  /**
   * Shared value location options.
   */
  export interface Options {

    /**
     * Detects a host element of the given one.
     *
     * By default utilizes a `nodeHost()` function that founds parent element crossing shadow DOM bounds.
     *
     * A `drekHost()` can be uses to also cross a rendered fragment bounds.
     *
     * @param element - An element to detect a host of.
     *
     * @returns Either a host element, or `undefined` if no host found.
     */
    readonly host?: ((this: void, element: Element) => Element | undefined) | undefined;

    /**
     * Whether to search locally, in consumer component itself.
     *
     * - `false` (by default), to start the search from consumer's parent,
     * - `true` to search locally, i.e. only in consumer component, or
     * - `'too'` to start the search from consumer component.
     */
    readonly local?: boolean | 'too' | undefined;

  }

  /**
   * Shared value location options with all properties present.
   */
  export type FullOptions = Required<Options>;

  /**
   * Shared value locator specifier.
   *
   * @typeParam T - Share value type.
   */
  export interface Spec<T> extends Options {

    /**
     * Target share.
     */
    readonly share?: ShareRef<T> | undefined;

  }

  /**
   * Mandatory shared value locator specifier.
   *
   * @typeParam T - Share value type.
   */
  export interface MandatorySpec<T> extends Spec<T> {

    /**
     * Target share.
     */
    readonly share: ShareRef<T>;

  }

  /**
   * Shared value locator specifier with all properties set.
   *
   * @typeParam T - Share value type.
   */
  export type FullSpec<T> = Required<MandatorySpec<T>>;

  /**
   * Signature of custom shared value locator.
   *
   * @typeParam T - Shared value type.
   * @typeParam consumer - Consumer component context.
   * @typeParam options - Shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
  export type Custom<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Full shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          options: FullOptions,
      ) => AfterEvent<[] | [T, ComponentContext]>;

  /**
   * Signature of custom shared value locator that expects a fallback share reference to be specified.
   *
   * @typeParam T - Shared value type.
   */
  export type CustomWithFallback<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Full shared value location specifier, including fallback share reference.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          spec: FullSpec<T>,
      ) => AfterEvent<[] | [T, ComponentContext]>;

  /**
   * Signature of shared value locator function.
   *
   * Can be constructed by {@link shareLocator} function.
   *
   * @typeParam T - Shared value type.
   */
  export type Fn<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          defaultSpec?: Spec<T>,
      ) => AfterEvent<[] | [T, ComponentContext]>;

}
