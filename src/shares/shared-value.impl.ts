import { cxBuildAsset } from '@proc7ts/context-builder';
import { CxAsset } from '@proc7ts/context-values';
import { AfterEvent, isAfterEvent, mapAfter, translateAfter } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { ComponentContext } from '@wesib/wesib';
import { Share } from './share';
import { Share__symbol } from './share-ref';
import { SharedValue, SharedValue__symbol } from './shared-value';
import { shareValueBy } from './sharer-aware';

export function SharedValue$ContextBuilder<T, TSharer extends object>(
    share: Share<T>,
    provider: SharedValue.Provider<T, TSharer>,
): CxAsset<AfterEvent<[T?]>, SharedValue<T> | AfterEvent<SharedValue<T>[]>, ComponentContext<TSharer>> {
  return {
    entry: share,
    placeAsset(_target) {
      // Nothing to place.
    },
    setupAsset(target) {

      const registrar = share.createRegistrar(target, provider);

      share.shareValue(registrar);

      return registrar.supply;
    },
  };
}

export function SharedValue$Registrar<T, TSharer extends object>(
    target: Share.Target<T, TSharer>,
    provider: SharedValue.Provider<T, TSharer>,
): SharedValue.Registrar<T> {
  return SharedValue$BoundRegistrar(target, SharedValue$bindProvider(provider));
}

function SharedValue$BoundRegistrar<T, TSharer extends object>(
    target: Share.Target<T, TSharer>,
    provider: SharedValue$BoundProvider<T, TSharer>,
): SharedValue.Registrar<T> {

  const { priority, supply, provide } = provider;

  return {
    priority,
    supply,
    shareAs: (alias, newPriority = priority) => {
      newPriority = Math.max(0, newPriority);
      target.provide(cxBuildAsset(
          alias[Share__symbol],
          newPriority
              ? SharedValue$detailedProvider(provide, newPriority)
              : SharedValue$bareProvider(provide),
      )).as(supply);
    },
    withPriority: newPriority => SharedValue$BoundRegistrar(
        target,
        { ...provider, priority: Math.max(0, newPriority) },
    ),
  };
}

interface SharedValue$BoundProvider<T, TSharer extends object> {
  readonly priority: number;
  readonly supply: Supply;
  provide(this: void, target: Share.Target<T, TSharer>): T | AfterEvent<[T?]>;
}

function SharedValue$bindProvider<T, TSharer extends object>(
    provider: SharedValue.Provider<T, TSharer>,
): SharedValue$BoundProvider<T, TSharer> {

  const priority = provider.priority ? Math.max(0, provider.priority) : 0;
  const { supply = new Supply() } = provider;

  return {
    priority,
    supply,
    provide: (target: Share.Target<T, TSharer>): T | AfterEvent<[T?]> => {

      const valueOrKeeper = provider.provide(target);

      return isAfterEvent(valueOrKeeper)
          ? valueOrKeeper.do(
              mapAfter((value?: T) => shareValueBy(target.context, value)),
          )
          : shareValueBy(target.context, valueOrKeeper);
    },
  };
}

function SharedValue$bareProvider<T, TSharer extends object>(
    provider: (target: Share.Target<T, TSharer>) => T | AfterEvent<[T?]>,
): (
    target: Share.Target<T, TSharer>,
) => T | AfterEvent<T[]> | null | undefined {
  return target => {

    const value = provider(target);

    if (isAfterEvent(value)) {
      return value.do(
          translateAfter((send, value?) => value !== undefined ? send(value) : send()),
      );
    }

    return value;
  };
}

function SharedValue$detailedProvider<T, TSharer extends object>(
    provider: (target: Share.Target<T, TSharer>) => T | AfterEvent<[T?]>,
    priority: number,
): (
    target: Share.Target<T, TSharer>,
) => SharedValue.Detailed<T> {
  return target => ({
    [SharedValue__symbol]: {
      priority,
      get: () => provider(target),
    },
  });
}
