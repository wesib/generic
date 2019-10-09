/**
 * @module @wesib/generic
 */
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
