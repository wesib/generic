import { nextArgs } from 'call-thru';
import { ContextRegistry } from 'context-values';
import { AfterEvent, nextAfterEvent } from 'fun-events';
import { HierarchyContext } from './hierarchy-context';

/**
 * @internal
 */
export function newHierarchyRegistry<T extends object>(
    up: AfterEvent<[HierarchyContext?]>,
): ContextRegistry<HierarchyContext<T>> {
  return new ContextRegistry(
      key => up.keep.thru(
          upper => upper ? nextAfterEvent(upper.get(key as any)) : nextArgs(),
      ) as any,
  );
}
