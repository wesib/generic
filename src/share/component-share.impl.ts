import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent } from '@proc7ts/fun-events';
import { arrayOfElements, Supply } from '@proc7ts/primitives';
import { DefinitionContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShareKey } from './component-share-key.impl';
import { ComponentShare__symbol } from './component-share-ref';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { SharedByComponent } from './shared-by-component';

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
    this._aliases = arrayOfElements(options.as).map(alias => alias[ComponentShare__symbol]);
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
