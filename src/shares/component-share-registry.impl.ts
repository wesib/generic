import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { bootstrapDefault, ComponentClass, DefaultNamespaceAliaser } from '@wesib/wesib';
import { ComponentShare } from './component-share';

const ComponentShareRegistry__key = (/*#__PURE__*/ new SingleContextKey(
    'component-share-registry',
    {
      byDefault: bootstrapDefault(bsContext => new ComponentShareRegistry(bsContext.get(DefaultNamespaceAliaser))),
    },
));

/**
 * @internal
 */
export class ComponentShareRegistry {

  static get [ContextKey__symbol](): ContextKey<ComponentShareRegistry> {
    return ComponentShareRegistry__key;
  }

  private readonly _sharers = new Map<ComponentShare<unknown>, ValueTracker<ComponentSharers>>();

  constructor(readonly nsAlias: DefaultNamespaceAliaser) {
  }

  addSharer(
      share: ComponentShare<unknown>,
      componentType: ComponentClass,
      elementName: string | undefined,
      supply: Supply,
  ): void {

    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = ComponentSharers$new();
      this._sharers.set(share, sharers);
      ComponentSharers$addSharer(sharers, componentType, supply);
      ComponentSharers$addName(sharers, elementName, supply);
    } else {
      ComponentSharers$addSharer(sharers, componentType, supply);
      ComponentSharers$addName(sharers, elementName, supply);
      sharers.it = { ...sharers.it };
    }
  }

  sharers(share: ComponentShare<unknown>): ValueTracker<ComponentSharers> {

    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = ComponentSharers$new();
      this._sharers.set(share, sharers);
    }

    return sharers;
  }

}

/**
 * @internal
 */
export interface ComponentSharers {

  readonly names: Map<string, number>;
  readonly sharers: Map<ComponentClass, number>;

}

function ComponentSharers$new(): ValueTracker<ComponentSharers> {
  return trackValue({ names: new Map(), sharers: new Map() });
}

function ComponentSharers$addName(
    tracker: ValueTracker<ComponentSharers>,
    name: string | undefined,
    supply: Supply,
): void {
  if (!name) {
    return;
  }

  const sharers = tracker.it;
  const counter = sharers.names.get(name) || 0;

  sharers.names.set(name, counter + 1);
  supply.whenOff(() => {

    const counter = sharers.names.get(name)! - 1;

    if (counter > 0) {
      sharers.names.set(name, counter);
    } else {
      sharers.names.delete(name);
    }

    tracker.it = { ...sharers };
  });
}

function ComponentSharers$addSharer(
    tracker: ValueTracker<ComponentSharers>,
    componentType: ComponentClass,
    supply: Supply,
): void {

  const sharers = tracker.it;
  const counter = sharers.sharers.get(componentType) || 0;

  sharers.sharers.set(componentType, counter + 1);
  supply.whenOff(() => {

    const counter = sharers.sharers.get(componentType)! - 1;

    if (counter > 0) {
      sharers.sharers.set(componentType, counter);
    } else {
      sharers.sharers.delete(componentType);
    }

    tracker.it = { ...sharers };
  });
}
