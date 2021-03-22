import { newRenderSchedule, RenderScheduler } from '@frontmeans/render-scheduler';
import { Supply } from '@proc7ts/supply';

const CssClass$counters = (/*#__PURE__*/ Symbol('CssClass.counters'));

interface CssClass$Element extends Element {

  [CssClass$counters]?: Partial<Record<string, number>>;

}

/**
 * Added CSS class rendering options.
 */
export interface AddCssClassOptions {

  /**
   * Render scheduler to use for DOM manipulations.
   *
   * Default render scheduler when omitted.
   */
  readonly scheduler?: RenderScheduler;

}

/**
 * Adds CSS class to target element.
 *
 * The same CSS class can be supplied multiple times. In this case the class would be removed when no more suppliers
 * left.
 *
 * @param target - Element to add CSS class to.
 * @param className - Class name to add.
 * @param options - CSS class rendering options.
 *
 * @returns Added CSS class supply that removes the class once cut off, unless there are other supplies of the same
 * class.
 */
export function addCssClass(
    target: Element,
    className: string,
    options?: AddCssClassOptions,
): Supply;

export function addCssClass(
    target: CssClass$Element,
    className: string,
    {
      scheduler = newRenderSchedule,
    }: AddCssClassOptions = {},
): Supply {

  const supply = new Supply();
  const schedule = scheduler({ node: target });

  schedule(() => {
    if (!supply.isOff) {

      const counters = target[CssClass$counters] || (target[CssClass$counters] = {});

      counters[className] = (counters[className] || 0) + 1;
      target.classList.add(className);

      supply.whenOff(() => schedule(() => {
        if (!--(counters[className]!)) {
          target.classList.remove(className);
        }
      }));
    }
  });

  return supply;
}
