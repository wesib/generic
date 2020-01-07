import {
  BootstrapContext,
  BootstrapRoot,
  ComponentContext,
  ComponentContext__symbol,
  ComponentEvent,
} from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { DomEventDispatcher, EventEmitter, OnEvent } from 'fun-events';

const HierarchyInit = (/*#__PURE__*/ new SingleContextKey<0>(
    'hierarchy-init',
    {
      byDefault: bsContext => {

        const root: Element = bsContext.get(BootstrapRoot);

        new DomEventDispatcher(root).on<ComponentEvent>('wesib:component')(
            ({ context }: ComponentEvent) => context.get(HierarchyUpdates),
        );

        return 0;
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

    this.on = updates.on;
    this.send = () => updates.send(context);

    context.whenOn(() => findParentContext(context)?.get(HierarchyUpdates).send());
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
export function initHierarchyUpdates(context: ComponentContext) {
  context.get(BootstrapContext).get(HierarchyInit);
  context.get(HierarchyUpdates);
}
