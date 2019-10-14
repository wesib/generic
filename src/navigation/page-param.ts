/**
 * @module @wesib/generic
 */
import { Page } from './page';

/**
 * A key of {@link PageParam.Request page parameter request} property containing requested page parameter.
 */
export const PageParam__symbol = /*#__PURE__*/ Symbol('page-param');

/**
 * Page navigation parameter.
 *
 * Can applied before navigation happened (i.e. to [[LeavePageEvent]]). Then it will be available to the target page
 * both before and after navigation.
 *
 * @typeparam T  Parameter value type.
 * @typaparam O  Parameter options type.
 */
export abstract class PageParam<T, O> implements PageParam.Request<T, O> {

  get [PageParam__symbol](): this {
    return this;
  }

  /**
   * Creates page parameter handle.
   *
   * This method is called when {@link Page.set assigning new page parameter}.It is called at most once per request,
   * unless this parameter is assigned already. A {@link PageParam.Handle.refine} method will be called instead
   * in the latter case.
   *
   * @param page  A page to assign navigation parameter to.
   * @param options  Initial parameter options.
   *
   * @returns New page parameter value handle.
   */
  abstract create(page: Page, options: O): PageParam.Handle<T, O>;

}

export namespace PageParam {

  /**
   * Page navigation parameter request.
   *
   * It is passed to {@link Page.get} method to retrieve corresponding parameter.
   */
  export interface Request<T, O> {

    /**
     * Requested page navigation parameter instance.
     */
    readonly [PageParam__symbol]: PageParam<T, O>;

  }

  /**
   * Page navigation parameter value handle.
   *
   * Holds and maintains parameter value.
   *
   * Created by {@link PageParam.create} method.
   */
  export interface Handle<T, O> {

    /**
     * Returns current parameter value.
     *
     * @returns Parameter value.
     */
    get(): T;

    /**
     * Refines page parameter value.
     *
     * This method is called when {@link Page.set re-assigning page parameter}. It is called when page parameter
     * is assigned already and can be used to update it. The update logic is up to the implementation.
     *
     * @param options  Parameter refinement options.
     */
    refine(options: O): void;

    /**
     * This method is called when the page this parameter created for is entered.
     *
     * @param page  Entered page.
     * @param when  When the page is entered. Either `init`, `open`, `replace`, or `return`.
     */
    enter?(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void;

    /**
     * This method is called when the page this parameter created for is left.
     */
    leave?(): void;

    /**
     * This method is called when page navigation aborted and target page won't be reached.
     *
     * The handle won't be accessed after this method call.
     *
     * @param at  The page the browser remains at.
     */
    stay?(at: Page): void;

    /**
     * This method is called when the page this parameter is created for is removed from navigation history.
     *
     * The handle won't be accessed after this method call.
     */
    forget?(): void;

  }

}
