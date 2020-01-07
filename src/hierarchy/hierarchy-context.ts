/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, afterEventBy, trackValue } from 'fun-events';
import { findParentContext, HierarchyUpdates, initHierarchyUpdates } from './hierarchy-updates.impl';

const HierarchyContext__key = (/*#__PURE__*/ new SingleContextKey<HierarchyContext>(
    'hierarchy-context',
    {
      byDefault: context => newHierarchyContext(context.get(ComponentContext)),
    },
));

/**
 * Component's hierarchy context.
 *
 * Passes provided values to hierarchy contexts of nested components.
 *
 * Available as component context value.
 *
 * @typeparam T  A type of component.
 */
export abstract class HierarchyContext<T extends object = any> {

  /**
   * A key of component context value containing its hierarchy context instance.
   */
  static get [ContextKey__symbol](): ContextKey<HierarchyContext> {
    return HierarchyContext__key;
  }

  /**
   * Component context.
   */
  abstract readonly context: ComponentContext<T>;

  /**
   * An `AfterEvent` keeper of enclosing component's hierarchy context.
   *
   * May send `undefined` when component is outside of hierarchy. E.g. when it is disconnected.
   */
  abstract readonly up: AfterEvent<[HierarchyContext?]>;

}

function newHierarchyContext(context: ComponentContext): HierarchyContext {
  initHierarchyUpdates(context);

  const findParentHierarchy = () => findParentContext(context)?.get(HierarchyContext);
  const up = afterEventBy<[HierarchyContext?]>(
      receiver => {

        const parentHierarchy = trackValue<HierarchyContext>();

        parentHierarchy.read.tillOff(receiver.supply).consume(
            newParent => newParent && newParent.context.get(HierarchyUpdates).on(
                () => parentHierarchy.it = findParentHierarchy(),
            ),
        );
        parentHierarchy.read(receiver);
        context.whenOn({
          supply: receiver.supply,
          receive: (_, onSupply) => {
            parentHierarchy.it = findParentHierarchy();
            onSupply.whenOff(
                () => Promise.resolve().then(
                    () => context.connected || (parentHierarchy.it = undefined),
                ),
            );
          },
        });
      },
  ).share();

  class HierarchyCtx extends HierarchyContext {

    get context() {
      return context;
    }

    get up() {
      return up;
    }

  }

  return new HierarchyCtx();
}
