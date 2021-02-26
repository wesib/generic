import { html__naming } from '@frontmeans/namespace-aliaser';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent } from '@proc7ts/fun-events';
import { arrayOfElements, Supply } from '@proc7ts/primitives';
import { BootstrapContext, DefinitionContext } from '@wesib/wesib';
import { Share } from './share';
import { ShareKey } from './share-key.impl';
import { Share__symbol } from './share-ref';
import { ShareRegistry } from './share-registry.impl';
import { SharedValue } from './shared-value';

/**
 * @internal
 */
export const Share$impl__symbol = (/*#__PURE__*/ Symbol('Share.impl'));

/**
 * @internal
 */
export class Share$<T> {

  readonly key: ContextUpKey<AfterEvent<[T?]>, SharedValue<T>>;
  private readonly _aliases: readonly Share<T>[];

  constructor(
      private readonly _share: Share<T>,
      readonly name: string,
      options: Share.Options<T>,
  ) {
    this.key = new ShareKey(name, _share);
    this._aliases = arrayOfElements(options.as).map(alias => alias[Share__symbol]);
  }

  addSharer(defContext: DefinitionContext, options: SharedValue.Options = {}): Supply {

    const { local, name = defContext.elementDef.name } = options;
    const registry = defContext.get(BootstrapContext).get(ShareRegistry);
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
