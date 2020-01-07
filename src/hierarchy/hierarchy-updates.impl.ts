import {
  BootstrapContext,
  BootstrapRoot,
  ComponentContext,
  ComponentContext__symbol,
  ComponentEvent,
} from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { DomEventDispatcher, EventEmitter, OnEvent, trackValue, ValueTracker } from 'fun-events';

export type HierarchyRoot = ValueTracker<ComponentContext | undefined>;

/**
 * @internal
 */
export const HierarchyRoot = (/*#__PURE__*/ new SingleContextKey<HierarchyRoot>(
    'hierarchy-root',
    {
      byDefault: bsContext => {

        const root: Element = bsContext.get(BootstrapRoot);

        new DomEventDispatcher(root).on<ComponentEvent>('wesib:component')(
            ({ context }: ComponentEvent) => context.get(HierarchyUpdates),
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

  constructor(context: ComponentContext) {

    const updates = new EventEmitter<[ComponentContext]>();
    const hierarchyRoot = context.get(BootstrapContext).get(HierarchyRoot);

    this.on = updates.on;
    this.send = () => updates.send(context);

    context.whenOn(() => {

      const parent = findParentContext(context);

      if (parent) {
        parent.get(HierarchyUpdates).send();
      } else {
        hierarchyRoot.it = context;
      }
    });
  }

}

/**
 * @internal
 */
export function findParentContext(of: ComponentContext): ComponentContext | undefined {

  const root = of.get(BootstrapContext).get(BootstrapRoot);
  let element: Node = of.element;

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
      return ctx;
    }
    if (parent === root) {
      return;
    }

    element = parent;
  }
}

/**
 * @internal
 */
export function initHierarchyUpdates(context: ComponentContext): HierarchyRoot {

  const root = context.get(BootstrapContext).get(HierarchyRoot);

  context.get(HierarchyUpdates);

  return root;
}
