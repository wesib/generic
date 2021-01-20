import { html__naming } from '@frontmeans/namespace-aliaser';
import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import { AfterEvent, mapAfter, trackValue, ValueTracker } from '@proc7ts/fun-events';
import { neverSupply, Supply } from '@proc7ts/primitives';
import { bootstrapDefault, ComponentClass, DefaultNamespaceAliaser, DefinitionContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';

const ComponentShareRegistry__key = (/*#__PURE__*/ new SingleContextKey(
    'component-share-registry',
    {
      byDefault: bootstrapDefault(bsContext => new ComponentShareRegistry(bsContext.get(DefaultNamespaceAliaser))),
    },
));

export class ComponentShareRegistry {

  static get [ContextKey__symbol](): ContextKey<ComponentShareRegistry> {
    return ComponentShareRegistry__key;
  }

  private readonly _sharers = new Map<ComponentShare<any, any, any>, ValueTracker<[Map<Supply, string>]>>();

  constructor(private readonly _nsAlias: DefaultNamespaceAliaser) {
  }

  addSharer<TValue, TOpts extends any[], TClass extends ComponentClass>(
      share: ComponentShare<TValue, TOpts, TClass>,
      defContext: DefinitionContext<InstanceType<TClass>>,
  ): Supply {

    const { name } = defContext.elementDef;

    if (!name) {
      return neverSupply();
    }

    const elementName = html__naming.name(name, this._nsAlias).toLowerCase();
    const supply = new Supply();
    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = trackValue([new Map([[supply, elementName]])]);
      this._sharers.set(share, sharers);
    } else {

      const [map] = sharers.it;

      map.set(supply, elementName);
      sharers.it = [map];
    }

    return supply.whenOff(() => {

      const [map] = sharers!.it;

      map.delete(supply);
      sharers!.it = [map];
    });
  }

  sharers<TValue, TOpts extends any[], TClass extends ComponentClass>(
      share: ComponentShare<TValue, TOpts, TClass>,
  ): AfterEvent<[ReadonlySet<string>]> {

    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = trackValue([new Map()]);
      this._sharers.set(share, sharers);
    }

    return sharers.read.do(
        mapAfter(([map]) => new Set(map.values())),
    );
  }

}
