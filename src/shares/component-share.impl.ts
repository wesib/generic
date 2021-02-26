import { html__naming } from '@frontmeans/namespace-aliaser';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent } from '@proc7ts/fun-events';
import { arrayOfElements, Supply } from '@proc7ts/primitives';
import { BootstrapContext, DefinitionContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShareKey } from './component-share-key.impl';
import { ComponentShare__symbol } from './component-share-ref';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { SharedValue } from './shared-value';

/**
 * @internal
 */
export const ComponentShare$impl = (/*#__PURE__*/ Symbol('ComponentShare.impl'));

/**
 * @internal
 */
export class ComponentShare$<T> {

  readonly key: ContextUpKey<AfterEvent<[T?]>, SharedValue<T>>;
  private readonly _aliases: readonly ComponentShare<T>[];

  constructor(
      private readonly _share: ComponentShare<T>,
      readonly name: string,
      options: ComponentShare.Options<T>,
  ) {
    this.key = new ComponentShareKey(name, _share);
    this._aliases = arrayOfElements(options.as).map(alias => alias[ComponentShare__symbol]);
  }

  addSharer(defContext: DefinitionContext, options: SharedValue.Options = {}): Supply {

    const { local, name = defContext.elementDef.name } = options;
    const registry = defContext.get(BootstrapContext).get(ComponentShareRegistry);
    const supply = new Supply();
    const { componentType } = defContext;
    const elementName = local
        ? undefined
        : name && html__naming.name(name, registry.nsAlias).toLowerCase();

    registry.addSharer(this._share, componentType, elementName, supply);
    for (const alias of this._aliases) {
      registry.addSharer(alias, componentType, elementName, supply);
    }

    return supply;
  }

  shareValue(
      registrar: SharedValue.Registrar<T>,
  ): void {
    registrar.shareAs(this._share);

    const priorityOffset = registrar.priority + 1;

    this._aliases.forEach((alias, index) => {
      alias.shareValue(registrar.withPriority(priorityOffset + index));
    });
  }

}
