/**
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
   * Requests this page navigation parameter.
   *
   * @typeparam T  Parameter value type.
   * @param request  Page navigation parameter request.
   *
   * @returns Either requested parameter value, or `undefined` if requested parameter is not assigned to the page.
   */
  get<T>(request: PageParam.Request<T, unknown>): T | undefined;

  /**
   * Puts navigation parameter to this page.
   *
   * The meaning of putting depends on type parameter implementation. This can be e.g. a value assignment, or appending
   * to the list of values.
   *
   * @typeparam T  Parameter value type.
   * @typeparam I  Parameter input type.
   * @param request  Assigned page parameter request.
   * @param input  Parameter input to use when constructing its value.
   */
  put<T, I>(request: PageParam.Request<T, I>, input: I): void;

}
