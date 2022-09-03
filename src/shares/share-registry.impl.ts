import { NamespaceAliaser } from '@frontmeans/namespace-aliaser';
import { CxEntry, cxEvaluated, cxScoped } from '@proc7ts/context-values';
import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { BootstrapContext, ComponentClass } from '@wesib/wesib';
import { Share } from './share';

const ShareRegistry$perContext: CxEntry.Definer<ShareRegistry> = /*#__PURE__*/ cxScoped(
  BootstrapContext,
  cxEvaluated(target => new ShareRegistry(target.get(NamespaceAliaser))),
);

export class ShareRegistry {

  static perContext(target: CxEntry.Target<ShareRegistry>): CxEntry.Definition<ShareRegistry> {
    return ShareRegistry$perContext(target);
  }

  static toString(): string {
    return '[ShareRegistry]';
  }

  private readonly _sharers = new Map<Share<unknown>, ValueTracker<Sharers>>();

  constructor(readonly nsAlias: NamespaceAliaser) {}

  addSharer(
    share: Share<unknown>,
    componentType: ComponentClass,
    elementName: string | undefined,
    supply: Supply,
  ): void {
    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = Sharers$new();
      this._sharers.set(share, sharers);
      Sharers$addSharer(sharers, componentType, supply);
      Sharers$addName(sharers, elementName, supply);
    } else {
      Sharers$addSharer(sharers, componentType, supply);
      Sharers$addName(sharers, elementName, supply);
      sharers.it = { ...sharers.it };
    }
  }

  sharers(share: Share<unknown>): ValueTracker<Sharers> {
    let sharers = this._sharers.get(share);

    if (!sharers) {
      sharers = Sharers$new();
      this._sharers.set(share, sharers);
    }

    return sharers;
  }

}

export interface Sharers {
  readonly names: Map<string, number>;
  readonly sharers: Map<ComponentClass, number>;
}

function Sharers$new(): ValueTracker<Sharers> {
  return trackValue({ names: new Map(), sharers: new Map() });
}

function Sharers$addName(
  tracker: ValueTracker<Sharers>,
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

function Sharers$addSharer(
  tracker: ValueTracker<Sharers>,
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
