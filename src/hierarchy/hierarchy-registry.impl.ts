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
      <Src, Seed>(key: ContextSeedKey<Src, Seed>) => isContextSeedUpKey(key)
          ? up.do(digAfter(
              upper => upper ? upper.get(key) : afterThe(),
          )) as unknown as Seed
          : undefined,
  );
}

/**
 * @internal
 */
function isContextSeedUpKey<Src>(
    key: ContextSeedKey<Src | EventKeeper<Src[]>, any>,
): key is ContextUpKey.SeedKey<Src> {
  return 'upKey' in key;
}
