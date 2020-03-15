/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { BootstrapContext, ComponentContext } from '@wesib/wesib';
import {
  ContextKey,
  ContextKey__symbol,
  ContextRegistry,
  ContextValues,
  ContextValueSpec,
  SingleContextKey,
} from 'context-values';
import { AfterEvent, afterEventBy, EventKeeper, EventReceiver, EventSupply, eventSupply, trackValue } from 'fun-events';
import { newHierarchyRegistry } from './hierarchy-registry.impl';
import { findParentContext, HierarchyRoot, HierarchyUpdates } from './hierarchy-updates.impl';

/**
 * @internal
 */
const HierarchyContext__key = (/*#__PURE__*/ new SingleContextKey<HierarchyContext>(
    'hierarchy-context',
    {
      byDefault: context => new HierarchyContext$(context.get(ComponentContext)),
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
   * Builds an `AfterEvent` keeper of enclosing component's hierarchy context.
   *
   * May send `undefined` when component is outside of hierarchy. E.g. when it is disconnected.
   *
   * @returns An `AfterEvent` of enclosing hierarcy context.
   */
  abstract up(): AfterEvent<[HierarchyContext?]>;

  /**
   * Starts sending enclosing component's hierarchy context and updates to the given `receiver`
   *
   * May send `undefined` when component is outside of hierarchy. E.g. when it is disconnected.
   *
   * @param receiver  Target receiver of enclosing hierarchy context.
   *
   * @returns Enclosing hierarchy context supply.
   */
  abstract up(receiver: EventReceiver<[HierarchyContext?]>): EventSupply;

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

class HierarchyContext$<T extends object> extends HierarchyContext<T> {

  private readonly _registry: ContextRegistry<HierarchyContext<T>>;
  readonly get: HierarchyContext<T>['get'];

  constructor(readonly context: ComponentContext<T>) {
    super();

    const registry = this._registry = newHierarchyRegistry<T>(this.up());

    this.get = registry.newValues().get;
  }

  provide<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<HierarchyContext<T>, any, Deps, Src | EventKeeper<Src[]>, Seed>,
  ): () => void {
    return this._registry.provide(spec);
  }

  up(): AfterEvent<[HierarchyContext?]>;
  up(receiver: EventReceiver<[HierarchyContext?]>): EventSupply;
  up(receiver?: EventReceiver<[HierarchyContext?]>): AfterEvent<[HierarchyContext?]> | EventSupply {
    return (this.up = afterEventBy<[HierarchyContext?]>(
        receiver => {

          const parentHierarchy = trackValue<HierarchyContext>();
          const rootSupply = eventSupply().needs(receiver.supply);
          const parentSupply = eventSupply().needs(receiver.supply);
          const updateParent = (): void => {

            const parent = findParentContext(this.context);

            if (parent) {

              const [parentCtx, immediate] = parent;

              parentHierarchy.it = parentCtx.get(HierarchyContext);
              rootSupply.off();
              if (immediate) {
                parentSupply.off();
              }
            } else {
              parentHierarchy.it = undefined;
            }
          };

          this.context.get(BootstrapContext).get(HierarchyRoot).read({
            supply: rootSupply,
            receive: () => this.context.connected && updateParent(),
          });
          parentHierarchy.read().tillOff(parentSupply).consume(
              newParent => newParent && newParent.context.get(HierarchyUpdates).on.to(updateParent),
          );
          parentHierarchy.read(receiver);
          this.context.whenOn({
            supply: receiver.supply,
            receive: (_, onSupply) => {
              updateParent();
              onSupply.whenOff(
                  () => {
                    Promise.resolve().then(
                        () => this.context.connected || (parentHierarchy.it = undefined),
                    );
                  },
              );
            },
          });
        },
    ).share().F)(receiver);
  }

}