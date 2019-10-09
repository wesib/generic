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
   * Requests this page navigation parameter.
   *
   * @param request  Page navigation parameter request.
   *
   * @returns Either requested parameter value, or `undefined` if requested parameter is not assigned to the page.
   */
  get<T>(request: PageParam.Request<T, unknown>): T | undefined;

}

/**
 * Navigation target page.
 */
export interface TargetPage extends Page {

  /**
   * New window title.
   */
  readonly title?: string;

}
