/**
 * Component path used to find component nodes in the tree.
 *
 * It is an array of component path fragments, each of which contains a component node match criteria. It may be also
 * represented as string or an array containing strings. In these cases it can be interpreted with `ComponentPath.of()`
 * function.
 *
 * Component path may lead to multiple components or none at all.
 */
export type ComponentPath = (ComponentPath.Fragment | string)[] | string;

export namespace ComponentPath {

  /**
   * The normal form of component path. It is always an array of path fragments.
   */
  export type Normalized = Fragment[];

  /**
   * Unique component path consisting of node identifiers only.
   */
  export type Unique = { uid: string }[];

  /**
   * Component path fragment.
   *
   * Consists of conditions the component node(s) should satisfy.
   *
   * When contains no conditions, then matches any component node.
   */
  export interface Fragment {

    /**
     * Requested component unique identifier.
     *
     * An unique identifier assigned to component should be equal to this one.
     */
    uid?: string;

    /**
     * Requested component name.
     *
     * Component's element name should match this one.
     */
    name?: string;

    /**
     * Requested component index.
     *
     * Multiple component nodes could match other criteria specified by this fragment. Select the Nth one,
     * where `N = index`.
     */
    index?: number;

  }

  export function of(path: Unique): Unique;

  export function of(path: ComponentPath): Normalized;

  /**
   * Interpret component path and converts it to normal form.
   *
   * When the path is represented as a string, it is parsed as URL path. I.e. its fragments are separated by `/` sign
   * and are URL-encoded. Each fragment is then interpreted by `ComponentPath.fragment()` function.
   *
   * When the path is an array containing strings, each such string is parsed by `ComponentPath.fragment()` function.
   *
   * @param path Component path.
   *
   * @returns Normalized component path.
   */
  export function of(path: ComponentPath): Normalized {
    if (typeof path === 'string') {
      path = path.split('/');
    }

    const normalized: Normalized | null = path.reduce<Normalized | null>(
        (prev, frag, idx) => {

          const normFrag = fragment(frag);

          if (!prev) {
            if (normFrag === frag) {
              return null;
            }
            prev = path.slice(0, idx) as Normalized;
          }
          prev.push(normFrag);

          return prev;
        },
        null);

    return normalized || (path as Normalized);
  }

  /**
   * Interpret component path fragment and converts it to normal form.
   *
   * When fragment is string, it is converted to path fragment according to the following:
   *
   * - conditions are separated with semicolons (`;`),
   * - if condition is empty string or `*`, then it represents an empty criteria matching any component node,
   * - if condition starts with `!`, then the rest of the string is an `id`,
   * - if condition starts with decimal digit, then it is an `index`,
   * - otherwise, the condition it is a `name`.
   *
   * @param pathFragment Component path fragment. Mey be represented as string.
   *
   * @returns Normalized component path fragment, or the fragment itself if already normalized.
   */
  export function fragment(pathFragment: Fragment | string): Fragment {
    if (typeof pathFragment !== 'string') {
      return pathFragment;
    }

    const conditions = pathFragment.split(';');

    return conditions.reduce((prev, c) => ({ ...prev, ...condition(c) }), {});
  }

  function condition(input: string): Fragment {
    if (!input || input === '*') {
      return {};
    }

    const firstChar = input[0];

    if (firstChar === '!') {
      return { uid: decodeURIComponent(input.substring(1)) };
    }
    if (firstChar >= '0' && firstChar <= '9') {
      return { index: parseInt(input, 10) };
    }

    return { name: input };
  }

}
