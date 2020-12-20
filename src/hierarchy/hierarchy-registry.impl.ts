import { ContextRegistry, ContextSeedKey } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, afterThe, digAfter, EventKeeper } from '@proc7ts/fun-events';
import { HierarchyContext } from './hierarchy-context';

/**
 * @internal
 */
export function newHierarchyRegistry<T extends object>(
    up: AfterEvent<[HierarchyContext?]>,
): ContextRegistry<HierarchyContext<T>> {
  return new ContextRegistry(
      <TSrc, TSeed>(key: ContextSeedKey<TSrc, TSeed>) => isContextSeedUpKey(key)
          ? up.do(digAfter(
              upper => upper ? upper.get(key) : afterThe(),
          )) as unknown as TSeed
          : undefined,
  );
}

/**
 * @internal
 */
function isContextSeedUpKey<TSrc>(
    key: ContextSeedKey<TSrc | EventKeeper<TSrc[]>, any>,
): key is ContextUpKey.SeedKey<TSrc> {
  return 'upKey' in key;
}
