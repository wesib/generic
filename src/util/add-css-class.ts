import { RenderSchedule } from '@frontmeans/render-scheduler';
import { Supply } from '@proc7ts/supply';

const CssClass$counters = (/*#__PURE__*/ Symbol('CssClass.counters'));

interface CssClass$Element extends Element {

  [CssClass$counters]?: Partial<Record<string, number>>;

}

/**
 * Adds CSS class to target element.
 *
 * The same CSS class can be supplied multiple times. In this case the class would be removed when no more suppliers
 * left.
 *
 * @param target - Element to add CSS class to.
 * @param className - Class name to add.
 * @param schedule - Render schedule to use for DOM manipulations. Performs operations immediately when omitted.
 *
 * @returns Added CSS class supply that removes the class once cut off, unless there are other supplies of the same
 * class.
 */
export function addCssClass(target: Element, className: string, schedule?: RenderSchedule): Supply;

export function addCssClass(
    target: CssClass$Element,
    className: string,
    schedule: (shot: () => void) => void = shot => shot(),
): Supply {

  const supply = new Supply();

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
