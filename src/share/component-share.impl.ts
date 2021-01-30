import { ContextRegistry } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, EventKeeper } from '@proc7ts/fun-events';
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

  readonly key: ContextUpKey<AfterEvent<[T] | []>, SharedByComponent<T>>;
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

  shareValue<TComponent extends object>(
      registry: ContextRegistry<ComponentContext<TComponent>>,
      provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T] | []>,
      order = 0,
  ): Supply {

    const firstIndex = Math.max(0, order);
    const supply = registry.provide({
      a: this._share,
      by: firstIndex
          ? (
              ctx: ComponentContext<TComponent>,
          ): SharedByComponent<T> | EventKeeper<SharedByComponent<T>[]> | null | undefined => ({
            [SharedByComponent__symbol]: {
              order: firstIndex,
              get: () => provider(ctx),
            },
          })
          : (
              ctx: ComponentContext<TComponent>,
          ): T | EventKeeper<T[]> | null | undefined => provider(ctx),
    });

    this._aliases.forEach((alias, index) => {
      registry
          .provide({
            a: alias,
            by: (ctx: ComponentContext<TComponent>): SharedByComponent.Detailed<T> => ({
              [SharedByComponent__symbol]: {
                order: firstIndex + 1 + index,
                get: () => provider(ctx),
              },
            }),
          })
          .needs(supply)
          .cuts(supply);
    });

    return supply;
  }

}
