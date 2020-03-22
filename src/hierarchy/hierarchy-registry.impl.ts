import { nextArgs } from '@proc7ts/call-thru';
import { ContextRegistry } from '@proc7ts/context-values';
import { AfterEvent, nextAfterEvent } from '@proc7ts/fun-events';
import { HierarchyContext } from './hierarchy-context';

/**
 * @internal
 */
export function newHierarchyRegistry<T extends object>(
    up: AfterEvent<[HierarchyContext?]>,
): ContextRegistry<HierarchyContext<T>> {
  return new ContextRegistry(
      key => up.keepThru(
          upper => upper ? nextAfterEvent(upper.get(key as any)) : nextArgs(),
      ) as any,
  );
}
