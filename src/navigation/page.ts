/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { PageParam } from './page-param';

/**
 * Navigated page representation.
 *
 * Represents a navigation history entry.
 */
export interface Page {

  /**
   * Page location URL.
   */
  readonly url: URL;

  /**
   * History entry data.
   */
  readonly data?: any;

  /**
   * New window title.
   */
  readonly title?: string;

  /**
   * Whether this page is visited at least one.
   *
   * This is `false` for target pages before navigating to them.
   */
  readonly visited: boolean;

  /**
   * Whether the page is the one opened in browser.
   */
  readonly current: boolean;

  /**
   * Requests this page navigation parameter.
   *
   * @typeparam T  Parameter value type.
   * @param ref  A reference to page navigation parameter to retrieve.
   *
   * @returns Either requested parameter value, or `undefined` if requested parameter is not assigned to the page.
   */
  get<T>(ref: PageParam.Ref<T, unknown>): T | undefined;

  /**
   * Puts navigation parameter to this page.
   *
   * The meaning of putting depends on type parameter implementation. This can be e.g. a value assignment, or appending
   * to the list of values.
   *
   * @typeparam T  Parameter value type.
   * @typeparam I  Parameter input type.
   * @param ref  A reference to page navigation parameter to put.
   * @param input  Parameter input to use when constructing its value.
   */
  put<T, I>(ref: PageParam.Ref<T, I>, input: I): void;

}
