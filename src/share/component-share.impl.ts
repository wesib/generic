import { ContextBuilder, ContextBuilder__symbol, ContextRegistry } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, AfterEvent__symbol, EventKeeper, isEventKeeper, translateAfter } from '@proc7ts/fun-events';
import { arrayOfElements, Supply } from '@proc7ts/primitives';
import { ComponentContext, DefinitionContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShareKey } from './component-share-key.impl';
import { ComponentShare__symbol } from './component-share-ref';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';

/**
 * @internal
 */
export const ComponentShare$impl = (/*#__PURE__*/ Symbol('ComponentShare.impl'));

/**
 * @internal
 */
export class ComponentShare$<T> {

  readonly key: ContextUpKey<AfterEvent<[T?]>, SharedByComponent<T>>;
  private readonly _aliases: readonly ComponentShare<T>[];

  constructor(
      private readonly _share: ComponentShare<T>,
      readonly name: string,
      options: ComponentShare.Options<T>,
  ) {
    this.key = new ComponentShareKey(name, _share);
    this._aliases = arrayOfElements(options.aliases).map(share => share[ComponentShare__symbol]());
  }

  addSharer(defContext: DefinitionContext, name = defContext.elementDef.name): Supply {

    const registry = defContext.get(ComponentShareRegistry);
    const supply = new Supply();

    registry.addSharer(this._share, name, supply);
    for (const alias of this._aliases) {
      registry.addSharer(alias, name, supply);
    }

    return supply;
  }

  shareValue(
      registrar: SharedByComponent.Registrar<T>,
  ): void {
    registrar.shareAs(this._share);

    const priorityOffset = registrar.priority + 1;

    this._aliases.forEach((alias, index) => {
      alias.shareValue(registrar.withPriority(priorityOffset + index));
    });
  }

}

/**
 * @internal
 */
export function SharedByComponent$ContextBuilder<T, TComponent extends object>(
    share: ComponentShare<T>,
    provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T?]>,
    priority?: number,
): ContextBuilder<ComponentContext<TComponent>> {
  return {
    [ContextBuilder__symbol]: registry => {

      const registrar = SharedByComponent$Registrar(registry, provider, priority);

      share.shareValue(registrar);

      return registrar.supply;
    },
  };
}

function SharedByComponent$Registrar<T, TComponent extends object>(
    registry: ContextRegistry<ComponentContext<TComponent>>,
    provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T?]>,
    priority = 0,
): SharedByComponent.Registrar<T> {

  const supply = new Supply();

  return {
    priority,
    supply,
    shareAs: (alias, newPriority = priority) => {
      newPriority = Math.max(0, newPriority);
      registry.provide({
        a: alias[ComponentShare__symbol](),
        by: newPriority
            ? SharedByComponent$detailedProvider(provider, newPriority)
            : SharedByComponent$bareProvider(provider),
      }).as(supply);
    },
    withPriority: newPriority => SharedByComponent$Registrar(registry, provider, Math.max(0, newPriority)),
  };
}

function SharedByComponent$bareProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T?]>,
): (
    context: ComponentContext<TComponent>,
) => T | EventKeeper<T[]> | null | undefined {
  return context => {

    const value = provider(context);

    if (isEventKeeper(value)) {
      return value[AfterEvent__symbol]().do(
          translateAfter((send, value?) => value !== undefined ? send(value) : send()),
      );
    }

    return value;
  };
}

function SharedByComponent$detailedProvider<T, TComponent extends object>(
    provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T?]>,
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
