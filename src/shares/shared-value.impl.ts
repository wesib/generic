import { cxTrackAsset } from '@proc7ts/context-builder';
import { CxAsset } from '@proc7ts/context-values';
import { AfterEvent, afterValue, isAfterEvent, mapAfter } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { ComponentContext } from '@wesib/wesib';
import { Share } from './share';
import { SharedValue, SharedValue__symbol } from './shared-value';
import { shareValueBy } from './sharer-aware';

export function SharedValue$ContextBuilder<T, TSharer extends object>(
  share: Share<T>,
  provider: SharedValue.Provider<T, TSharer>,
): CxAsset<AfterEvent<[T?]>, SharedValue<T>, ComponentContext<TSharer>> {
  return {
    entry: share,
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
    shareAs: ({ share }, newPriority = priority) => {
      newPriority = Math.max(0, newPriority);
      target.provide(
        newPriority
          ? SharedValue$placeDetailed(share, provide, newPriority)
          : SharedValue$placeBare(share, provide),
      );
    },
    withPriority: newPriority => SharedValue$BoundRegistrar(target, {
        ...provider,
        priority: Math.max(0, newPriority),
      }),
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
        ? valueOrKeeper.do(mapAfter((value?: T) => shareValueBy(target.context, value)))
        : shareValueBy(target.context, valueOrKeeper);
    },
  };
}

function SharedValue$placeBare<T, TSharer extends object>(
  share: Share<T>,
  provider: (target: Share.Target<T, TSharer>) => T | AfterEvent<[T?]>,
): CxAsset<AfterEvent<[T?]>, SharedValue<T>, ComponentContext<TSharer>> {
  return cxTrackAsset(share, (target, receiver, supply) => {
    afterValue<T | undefined>(provider(target))({
      receive(_, asset) {
        if (asset !== undefined) {
          receiver(asset);
        }
      },
      supply,
    });
  });
}

function SharedValue$placeDetailed<T, TSharer extends object>(
  share: Share<T>,
  provider: (target: Share.Target<T, TSharer>) => T | AfterEvent<[T?]>,
  priority: number,
): CxAsset<AfterEvent<[T?]>, SharedValue<T>, ComponentContext<TSharer>> {
  return cxTrackAsset(share, (target, receiver, supply) => {
    afterValue<T | undefined>(provider(target))({
      receive(_, asset) {
        if (asset !== undefined) {
          receiver({
            [SharedValue__symbol]: {
              priority,
              value: asset,
            },
          });
        }
      },
      supply,
    });
  });
}
