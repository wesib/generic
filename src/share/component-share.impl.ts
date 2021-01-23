import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, EventKeeper } from '@proc7ts/fun-events';
import { arrayOfElements, Supply, valueProvider } from '@proc7ts/primitives';
import { ComponentContext, DefinitionContext, DefinitionSetup } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShareKey } from './component-share-key.impl';
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
    this._aliases = arrayOfElements(options.aliases);
  }

  shareBy(defContext: DefinitionContext): Supply {

    const registry = defContext.get(ComponentShareRegistry);
    const supply = new Supply();

    registry.addSharer(this._share, defContext, supply);
    for (const alias of this._aliases) {
      registry.addSharer(alias, defContext, supply);
    }

    return supply;
  }

  provideValue<TComponent extends object>(
      setup: DefinitionSetup<TComponent>,
      provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[] | [T]>,
  ): void {

    let provide = (
        context: ComponentContext<TComponent>,
    ): T | EventKeeper<[] | [T]> => {

      const value = provider(context);

      provide = valueProvider(value);

      return value;
    };

    setup.perComponent({
      a: this._share,
      by: (
          ctx: ComponentContext<TComponent>,
      ): T | EventKeeper<T[]> | null | undefined => provide(ctx),
    });

    this._aliases.forEach((alias, index) => {
      setup.perComponent({
        a: alias,
        by: (ctx: ComponentContext<TComponent>): SharedByComponent.Detailed<T> => ({
          [SharedByComponent__symbol]: {
            order: index + 1,
            get: () => provide(ctx),
          },
        }),
      });
    });
  }

}
