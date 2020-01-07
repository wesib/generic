import { ContextRegistry } from 'context-values';
import { AfterEvent, afterThe } from 'fun-events';
import { HierarchyContext } from './hierarchy-context';

/**
 * @internal
 */
export function newHierarchyRegistry<T extends object>(
    up: AfterEvent<[HierarchyContext?]>,
): ContextRegistry<HierarchyContext<T>> {
  return new ContextRegistry(
      key => up.keep.dig(
          upper => ((upper ? upper.get(key) : afterThe()) as any),
      ) as any,
  );
}
