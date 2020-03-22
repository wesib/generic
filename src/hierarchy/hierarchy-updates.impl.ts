import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import { EventEmitter, OnEvent, trackValue, ValueTracker } from '@proc7ts/fun-events';
import { DomEventDispatcher } from '@proc7ts/fun-events/dom';
import {
  BootstrapContext,
  BootstrapRoot,
  ComponentContext,
  ComponentContext__symbol,
  ComponentEvent,
} from '@wesib/wesib';

/**
 * @internal
 */
export type HierarchyRoot = ValueTracker<ComponentContext | undefined>;

/**
 * @internal
 */
export const HierarchyRoot = (/*#__PURE__*/ new SingleContextKey<HierarchyRoot>(
    'hierarchy-root',
    {
      byDefault: bsContext => {

        const root: Element = bsContext.get(BootstrapRoot);

        new DomEventDispatcher(root).on<ComponentEvent>('wesib:component').to(
            ({ context }: ComponentEvent) => context.get(HierarchyUpdates).issue(),
        );

        return trackValue();
      },
    },
));

const HierarchyUpdates__key = (/*#__PURE__*/ new SingleContextKey<HierarchyUpdates>(
    'hierarchy-updates',
    {
      byDefault: context => new HierarchyUpdates(context.get(ComponentContext)),
    },
));

/**
 * @internal
 */
export class HierarchyUpdates {

  static get [ContextKey__symbol](): ContextKey<HierarchyUpdates> {
    return HierarchyUpdates__key;
  }

  readonly on: OnEvent<[ComponentContext]>;
  readonly send: (this: void) => void;
  readonly issue: () => void;

  constructor(context: ComponentContext) {

    const updates = new EventEmitter<[ComponentContext]>();
    const hierarchyRoot = context.get(BootstrapContext).get(HierarchyRoot);

    this.on = updates.on();
    this.send = () => updates.send(context);
    this.issue = () => {

      const parent = findParentContext(context);

      if (parent) {
        parent[0].get(HierarchyUpdates).send();
      } else {
        hierarchyRoot.it = context;
      }
    };
  }

}

/**
 * @internal
 */
export function findParentContext(of: ComponentContext): [ComponentContext, boolean] | undefined {

  const root = of.get(BootstrapContext).get(BootstrapRoot);
  let element: Node = of.element;
  let immediate = true;

  if (element === root) {
    return;
  }
  for (;;) {

    const parent = element.parentNode;

    if (!parent) {
      return;
    }

    const ctx: ComponentContext = (parent as any)[ComponentContext__symbol];

    if (ctx) {
      return [ctx, immediate];
    }
    if (parent === root) {
      return;
    }

    immediate = false;
    element = parent;
  }
}
