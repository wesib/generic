/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { noop } from '@proc7ts/call-thru';
import {
  ContextKey,
  ContextKey__symbol,
  ContextRegistry,
  ContextValues,
  ContextValueSpec,
  SingleContextKey,
} from '@proc7ts/context-values';
import {
  AfterEvent,
  afterEventBy,
  EventKeeper,
  EventReceiver,
  EventSupply,
  eventSupply,
  EventSupply__symbol,
  eventSupplyOf,
  EventSupplyPeer,
  trackValue,
  ValueTracker,
} from '@proc7ts/fun-events';
import { BootstrapContext, ComponentContext } from '@wesib/wesib';
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
export abstract class HierarchyContext<T extends object = any> extends ContextValues implements EventSupplyPeer {

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

  get [EventSupply__symbol](): EventSupply {
    return eventSupplyOf(this.context);
  }

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
   * Assigns enclosing component to use by default.
   *
   * The provided component will be treated as enclosing one until component element connected. After that the real
   * enclosing component will be used instead.
   *
   * @param enclosing  Enclosing component's context to assign, or nothing to remove one.
   *
   * @returns `this` instance.
   */
  abstract inside(enclosing?: ComponentContext): this;

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

  private readonly _parent: ValueTracker<HierarchyContext | undefined>;
  private readonly _registry: ContextRegistry<HierarchyContext<T>>;
  readonly get: HierarchyContext<T>['get'];

  constructor(readonly context: ComponentContext<T>) {
    super();

    const parent = this._parent = trackValue<HierarchyContext>();

    context.whenConnected(noop).cuts(parent);

    const registry = this._registry = newHierarchyRegistry<T>(this.up());

    this.get = registry.newValues().get;
  }

  provide<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<HierarchyContext<T>, any, Deps, Src | EventKeeper<Src[]>, Seed>,
  ): () => void {

    const off = this._registry.provide(spec);

    eventSupplyOf(this).whenOff(off);

    return off;
  }

  up(): AfterEvent<[HierarchyContext?]>;
  up(receiver: EventReceiver<[HierarchyContext?]>): EventSupply;
  up(receiver?: EventReceiver<[HierarchyContext?]>): AfterEvent<[HierarchyContext?]> | EventSupply {
    return (this.up = afterEventBy<[HierarchyContext?]>(
        receiver => {

          const { supply } = receiver;

          supply.needs(this);

          const parentHierarchy = trackValue<HierarchyContext>();

          parentHierarchy.by(this._parent);
          supply.cuts(parentHierarchy);

          const rootSupply = eventSupply().needs(supply);
          const parentSupply = eventSupply().needs(supply);
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
          this.context.whenConnected({
            supply: eventSupply().needs(supply),
            receive: updateParent,
          });
        },
    ).share().F)(receiver);
  }

  inside(enclosing?: ComponentContext): this {
    this._parent.it = enclosing && enclosing.get(HierarchyContext);
    return this;
  }

}
