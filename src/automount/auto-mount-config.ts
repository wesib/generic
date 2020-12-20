/**
 * @packageDocumentation
 * @module @wesib/generic
 */
/**
 * Auto-mount configuration options.
 *
 * Can be applied using {@link autoMountSupport} function, or provided in bootstrap context by any feature.
 */
export interface AutoMountConfig {

  /**
   * A selector of DOM elements to attempt to mount.
   *
   * An `AutoMountSupport` feature tries to adapt matching elements and potentially mount them.
   *
   * When unspecified or set to `true`, the selector is equal to `*`. I.e. matches all elements.
   * When set to `false` or empty string, the adaption step will be skipped.
   *
   * Note that selector is relative to `BootstrapRoot`,
   */
  readonly select?: string | boolean;

}
