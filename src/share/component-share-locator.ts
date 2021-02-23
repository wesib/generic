import { AfterEvent } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareRef, isComponentShareRef } from './component-share-ref';

/**
 * Shared value locator.
 *
 * Can be one of:
 *
 * - component share {@link ComponentShareRef reference},
 * - shared value locator specified {@link ComponentShareLocator.Spec},
 * - {@link ComponentShareLocator.CustomWithFallback custom} shared value locator, or
 * - `null`/`undefined` to locate a fallback share.
 *
 * A {@link componentShareLocator} function can be used to convert arbitrary locator to a function.
 *
 * @typeParam T - Shared value type.
 */
export type ComponentShareLocator<T> =
    | ComponentShareRef<T>
    | ComponentShareLocator.Spec<T>
    | ComponentShareLocator.CustomWithFallback<T>
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
export function componentShareLocator<T>(
    locator: ComponentShareLocator.Mandatory<T>,
    defaultOptions?: ComponentShareLocator.Options,
): ComponentShareLocator.Fn<T>;

/**
 * Converts arbitrary shared value locator to locator function.
 *
 * @typeParam T - Shared value type.
 * @param locator - Shared value locator to convert.
 * @param defaultSpec - Default shared value locator specifier including fallback share reference.
 *
 * @returns Shared value locator function.
 */
export function componentShareLocator<T>(
    locator: ComponentShareLocator<T>,
    defaultSpec: ComponentShareLocator.MandatorySpec<T>,
): ComponentShareLocator.Fn<T>;

export function componentShareLocator<T>(
    locator:
        | ComponentShareRef<T>
        | Partial<ComponentShareLocator.MandatorySpec<T>>
        | ComponentShareLocator.CustomWithFallback<T>
        | null
        | undefined,
    defaultSpec: ComponentShareLocator.Spec<T> = {},
): ComponentShareLocator.Fn<T> {
  if (isComponentShareRef(locator)) {

    const share = locator[ComponentShare__symbol];

    return (consumer, options = {}) => {

      const { local = defaultSpec.local } = options;

      return share.valueFor(consumer, { local });
    };
  }

  if (typeof locator === 'function') {

    const { local: localByDefault = false, share: shareByDefault } = defaultSpec;

    return (consumer, options = {}) => {

      const { share = shareByDefault!, local = localByDefault } = options;

      return locator(consumer, { share, local });
    };
  }

  const { share: shareRef = defaultSpec.share!, local: localByDefault = defaultSpec.local } = locator || {};
  const share = shareRef[ComponentShare__symbol];

  return (consumer, options = {}) => {

    const { local = localByDefault } = options;

    return share.valueFor(consumer, { local });
  };
}

export namespace ComponentShareLocator {

  /**
   * Mandatory shared value locator.
   *
   * Can be one of:
   *
   * - component share {@link ComponentShareRef reference},
   * - shared value locator specified {@link ComponentShareLocator.Spec}, or
   * - {@link ComponentShareLocator.Custom custom} shared value locator.
   *
   * A {@link componentShareLocator} function can be used to convert arbitrary locator to a function.
   *
   * @typeParam T - Shared value type.
   */
  export type Mandatory<T> =
      | ComponentShareRef<T>
      | MandatorySpec<T>
      | Custom<T>;

  /**
   * Shared value location options.
   */
  export interface Options {

    /**
     * Whether to search locally, in consumer component itself.
     *
     * - `false` (by default), to start the search from consumer's parent,
     * - `true` to search locally, i.e. only in consumer component, or
     * - `'too'` to start the search from consumer component.
     */
    readonly local?: boolean | 'too';

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
    readonly share?: ComponentShareRef<T>;

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
    readonly share: ComponentShareRef<T>;

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
   * Can be constructed by {@link componentShareLocator} function.
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
