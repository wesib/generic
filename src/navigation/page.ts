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
   * @param request  Page navigation parameter request.
   *
   * @returns Either requested parameter value, or `undefined` if requested parameter is not assigned to the page.
   */
  get<T>(request: PageParam.Request<T, unknown>): T | undefined;

  /**
   * Assigns navigation parameter of this page.
   *
   * @param request  Assigned page parameter request.
   * @param options  Parameter assignment option.
   */
  set<T, O>(request: PageParam.Request<T, O>, options: O): void;

}
