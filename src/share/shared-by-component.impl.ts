import { ContextBuilder, ContextBuilder__symbol, ContextRegistry } from '@proc7ts/context-values';
import { AfterEvent, AfterEvent__symbol, isEventKeeper, mapAfter, translateAfter } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShare__symbol } from './component-share-ref';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';

/**
 * @internal
 */
export function SharedByComponent$ContextBuilder<T, TSharer extends object>(
    share: ComponentShare<T>,
    provider: SharedByComponent.Provider<T, TSharer>,
): ContextBuilder<ComponentContext<TSharer>> {
  return {
    [ContextBuilder__symbol]: registry => {

      const registrar = share.createRegistrar(registry, provider);

      share.shareValue(registrar);

      return registrar.supply;
    },
  };
}

/**
 * @internal
 */
export function SharedByComponent$Registrar<T, TSharer extends object>(
    share: ComponentShare<T>,
    registry: ContextRegistry<ComponentContext<TSharer>>,
    provider: SharedByComponent.Provider<T, TSharer>,
): SharedByComponent.Registrar<T> {
  return SharedByComponent$BoundRegistrar(share, registry, SharedByComponent$bindProvider(share, provider));
}

function SharedByComponent$BoundRegistrar<T, TSharer extends object>(
    share: ComponentShare<T>,
    registry: ContextRegistry<ComponentContext<TSharer>>,
    provider: SharedByComponent$BoundProvider<T, TSharer>,
): SharedByComponent.Registrar<T> {

  const { priority, supply, provide } = provider;

  return {
    priority,
    supply,
    shareAs: (alias, newPriority = priority) => {
      newPriority = Math.max(0, newPriority);
      registry.provide({
        a: alias[ComponentShare__symbol],
        by: newPriority
            ? SharedByComponent$detailedProvider(provide, newPriority)
            : SharedByComponent$bareProvider(provide),
      }).as(supply);
    },
    withPriority: newPriority => SharedByComponent$BoundRegistrar(
        share,
        registry,
        { ...provider, priority: Math.max(0, newPriority) },
    ),
  };
}

interface SharedByComponent$BoundProvider<T, TSharer extends object> {
  readonly priority: number;
  readonly supply: Supply;
  provide(this: void, context: ComponentContext<TSharer>): T | AfterEvent<[T?]>;
}

function SharedByComponent$bindProvider<T, TSharer extends object>(
    share: ComponentShare<T>,
    provider: SharedByComponent.Provider<T>,
): SharedByComponent$BoundProvider<T, TSharer> {

  const priority = provider.priority ? Math.max(0, provider.priority) : 0;
  const { supply = new Supply() } = provider;

  return {
    priority,
    supply,
    provide: context => {

      const value = provider.provide(context);

      if (isEventKeeper(value)) {
        return value[AfterEvent__symbol]().do(
            mapAfter(value => value && share.bindValue(value, context)),
        );
      }

      return share.bindValue(value, context);
    },
  };
}

function SharedByComponent$bareProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | AfterEvent<[T?]>,
): (
    context: ComponentContext<TComponent>,
) => T | AfterEvent<T[]> | null | undefined {
  return context => {

    const value = provider(context);

    if (isEventKeeper(value)) {
      return value.do(
          translateAfter((send, value?) => value !== undefined ? send(value) : send()),
      );
    }

    return value;
  };
}

function SharedByComponent$detailedProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | AfterEvent<[T?]>,
    priority: number,
): (
    context: ComponentContext<TComponent>,
) => SharedByComponent.Detailed<T> {
  return context => ({
    [SharedByComponent__symbol]: {
      priority,
      get: () => provider(context),
    },
  });
}
