import { applyContextTo, ContextBuilder, ContextBuilder__symbol, ContextRegistry } from '@proc7ts/context-values';
import { applyContextAfter } from '@proc7ts/context-values/updatable';
import { AfterEvent, isAfterEvent, translateAfter } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShare__symbol } from './component-share-ref';
import { SharedValue, SharedValue__symbol } from './shared-value';

/**
 * @internal
 */
export function SharedValue$ContextBuilder<T, TSharer extends object>(
    share: ComponentShare<T>,
    provider: SharedValue.Provider<T, TSharer>,
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
export function SharedValue$Registrar<T, TSharer extends object>(
    registry: ContextRegistry<ComponentContext<TSharer>>,
    provider: SharedValue.Provider<T, TSharer>,
): SharedValue.Registrar<T> {
  return SharedValue$BoundRegistrar(registry, SharedValue$bindProvider(provider));
}

function SharedValue$BoundRegistrar<T, TSharer extends object>(
    registry: ContextRegistry<ComponentContext<TSharer>>,
    provider: SharedValue$BoundProvider<T, TSharer>,
): SharedValue.Registrar<T> {

  const { priority, supply, provide } = provider;

  return {
    priority,
    supply,
    shareAs: (alias, newPriority = priority) => {
      newPriority = Math.max(0, newPriority);
      registry.provide({
        a: alias[ComponentShare__symbol],
        by: newPriority
            ? SharedValue$detailedProvider(provide, newPriority)
            : SharedValue$bareProvider(provide),
      }).as(supply);
    },
    withPriority: newPriority => SharedValue$BoundRegistrar(
        registry,
        { ...provider, priority: Math.max(0, newPriority) },
    ),
  };
}

interface SharedValue$BoundProvider<T, TSharer extends object> {
  readonly priority: number;
  readonly supply: Supply;
  provide(this: void, context: ComponentContext<TSharer>): T | AfterEvent<[T?]>;
}

function SharedValue$bindProvider<T, TSharer extends object>(
    provider: SharedValue.Provider<T>,
): SharedValue$BoundProvider<T, TSharer> {

  const priority = provider.priority ? Math.max(0, provider.priority) : 0;
  const { supply = new Supply() } = provider;

  return {
    priority,
    supply,
    provide: (context: ComponentContext): T | AfterEvent<[T?]> => {

      const value = provider.provide(context);

      if (isAfterEvent(value)) {
        return value.do(
            applyContextAfter(context),
        );
      }

      return applyContextTo(value)(context);
    },
  };
}

function SharedValue$bareProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | AfterEvent<[T?]>,
): (
    context: ComponentContext<TComponent>,
) => T | AfterEvent<T[]> | null | undefined {
  return context => {

    const value = provider(context);

    if (isAfterEvent(value)) {
      return value.do(
          translateAfter((send, value?) => value !== undefined ? send(value) : send()),
      );
    }

    return value;
  };
}

function SharedValue$detailedProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | AfterEvent<[T?]>,
    priority: number,
): (
    context: ComponentContext<TComponent>,
) => SharedValue.Detailed<T> {
  return context => ({
    [SharedValue__symbol]: {
      priority,
      get: () => provider(context),
    },
  });
}
