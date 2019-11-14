/**
 * @module @wesib/generic
 */
import { filterIt, flatMapIt } from 'a-iterable';

const spaceSep = /\s+/;

/**
 * Detects element behavior(s) based on its `b-a` and `data-b-a` attributes values.
 *
 * The attribute contains whitespace-separated behavior specs. Each spec may contain a colon-separated parts:
 * - When behavior spec starts with `-` sign the behavior is disabled (set to `false`).
 * - Otherwise the behavior value is set to `true`.
 * - When behavior spec starts with `<prefix>:<part>`, where `<prefix>` may contain multiple colon-separated parts,
 *   and `<part>` is not colon separated and is followed by either colon or end of string, the `<prefix>` behavior value
 *   is set to `<part>`.
 *
 * The following behavior specifications have special meaning:
 * - `-` - Element behavior must remain intact, i.e. element must not be enhanced.
 *   A `null` will be returned from function call if this behavior is present among their list.
 * - `*` - Element behavior is ignored.
 *   This typically means that it should be detected automatically based on other criteria.
 *   An empty map of behaviors will be returned from function call if `*` is the only behavior present in their list.
 *   This is the same as empty attribute value or its absence.
 * - All other values are treated specifically by enhancer.
 *   Enhancers should ignore unknown behaviors.
 *
 * This function should be used by element enhancers and adapters to decide whether to enhance target element.
 *
 * @param element  An element to detect behaviors of.
 *
 * @returns Either a map of element behaviors as keys and their values, or `null` if target `element`
 * must remain intact. When behavior value is absent it is replaced with `on`.
 */
export function elementBehaviors(element: Element): Map<string, string | boolean> | null {

  let be = element.getAttribute('b-a');
  const dataBe = element.getAttribute('data-b-a');

  if (!be) {
    if (!dataBe) {
      return new Map();
    }
    be = dataBe;
  } else if (dataBe) {
    be += ' ' + dataBe;
  }

  const behaviors = new Map<string, string | boolean>(
      filterIt(
          flatMapIt(
              be.trim().split(spaceSep),
              elementBehaviorSpecs,
          ),
          ([name, value]) => !value || name !== '*',
      ),
  );

  return behaviors.get('') !== false ? behaviors : null;

}

function *elementBehaviorSpecs(behavior: string): Iterable<[string, string | boolean]> {
  if (behavior[0] === '-') {
    yield [behavior.substring(1), false];
    return;
  }

  const parts = behavior.split(':');
  let prefix = parts[0];

  for (let i = 1; i < parts.length; ++i) {

    const part = parts[i];

    yield [prefix, part];
    prefix += ':' + part;
  }

  yield[behavior, true];
}
