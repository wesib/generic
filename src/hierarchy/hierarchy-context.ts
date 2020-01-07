/**
 * @module @wesib/generic
 */
import { BootstrapContext, ComponentContext } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, ContextValues, ContextValueSpec, SingleContextKey } from 'context-values';
import { AfterEvent, afterEventBy, EventKeeper, eventSupply, trackValue } from 'fun-events';
import { newHierarchyRegistry } from './hierarchy-registry.impl';
import { findParentContext, HierarchyRoot, HierarchyUpdates } from './hierarchy-updates.impl';

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
export abstract class HierarchyContext<T extends object = any> extends ContextValues {

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

  /**
   * Provides hierarchy context value.
   *
   * The provided value will be available in context itself, as well as in all nested hierarchy contexts.
   *
   * Note that the provided value key has to `ContextUpKey`.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   * @param spec  Context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  abstract provide<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<HierarchyContext<T>, any, Deps, Src | EventKeeper<Src[]>, Seed>,
  ): () => void;

}

function newHierarchyContext<T extends object>(context: ComponentContext<T>): HierarchyContext<T> {

  const hierarchyRoot = context.get(BootstrapContext).get(HierarchyRoot);
  const findParentHierarchy = () => findParentContext(context)?.get(HierarchyContext);
  const up = afterEventBy<[HierarchyContext?]>(
      receiver => {

        const parentHierarchy = trackValue<HierarchyContext>();
        const updateParent = () => parentHierarchy.it = findParentHierarchy();
        const rootSupply = eventSupply().needs(receiver.supply);

        hierarchyRoot.read({
          supply: rootSupply,
          receive: () => context.connected && updateParent(),
        });
        parentHierarchy.read.tillOff(receiver.supply).consume(
            newParent => newParent && rootSupply.off() && newParent.context.get(HierarchyUpdates).on(updateParent),
        );
        parentHierarchy.read(receiver);
        context.whenOn({
          supply: receiver.supply,
          receive: (_, onSupply) => {
            updateParent();
            onSupply.whenOff(
                () => Promise.resolve().then(
                    () => context.connected || (parentHierarchy.it = undefined),
                ),
            );
          },
        });
      },
  ).share();
  const registry = newHierarchyRegistry<T>(up);
  const values = registry.newValues();

  class HierarchyCtx extends HierarchyContext<T> {

    readonly get = values.get;

    get context() {
      return context;
    }

    get up() {
      return up;
    }

    provide<Deps extends any[], Src, Seed>(
        spec: ContextValueSpec<HierarchyContext<T>, any, Deps, Src | EventKeeper<Src[]>, Seed>,
    ) {
      return registry.provide(spec);
    }

  }

  return new HierarchyCtx();
}
