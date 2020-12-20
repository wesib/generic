/**
 * @packageDocumentation
 * @module @wesib/generic
 */
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
  consumeEvents,
  shareAfter,
  supplyAfter,
  trackValue,
  ValueTracker,
} from '@proc7ts/fun-events';
import { noop, Supply, SupplyPeer } from '@proc7ts/primitives';
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
 * @typeParam T - A type of component.
 */
export abstract class HierarchyContext<T extends object = any> extends ContextValues implements SupplyPeer {

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

  get supply(): Supply {
    return this.context.supply;
  }

  /**
   * Assigns enclosing component to use by default.
   *
   * The provided component will be treated as enclosing one until component element connected. After that the real
   * enclosing component will be used instead.
   *
   * @param enclosing - Enclosing component's context to assign, or nothing to remove one.
   *
   * @returns `this` instance.
   */
  abstract inside(enclosing?: ComponentContext): this;

  /**
   * Provides hierarchy context value.
   *
   * If provided value is updatable (i.e. its key implements `ContextUpKey`), then it will be available in this context,
   * as well as in all nested hierarchy contexts. Otherwise the value will be available in this context only.
   *
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   * @param spec - Context value specifier.
   *
   * @returns A value supply that that removes the given context value specifier once cut off.
   */
  abstract provide<TDeps extends any[], TSrc, TSeed>(
      spec: ContextValueSpec<HierarchyContext<T>, any, TDeps, TSrc, TSeed>,
  ): Supply;

}

class HierarchyContext$<T extends object> extends HierarchyContext<T> {

  private readonly _parent: ValueTracker<HierarchyContext | undefined>;
  private readonly _registry: ContextRegistry<HierarchyContext<T>>;
  readonly get: HierarchyContext<T>['get'];
  readonly up: AfterEvent<[HierarchyContext?]>;

  constructor(readonly context: ComponentContext<T>) {
    super();

    this.up = afterEventBy<[HierarchyContext?]>(
        receiver => {

          const { supply } = receiver;

          supply.needs(this);

          const parentHierarchy = trackValue<HierarchyContext>();

          parentHierarchy.by(this._parent);
          supply.cuts(parentHierarchy);

          const rootSupply = new Supply().needs(supply);
          const parentSupply = new Supply().needs(supply);
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
          parentHierarchy.read.do(
              supplyAfter(parentSupply),
              consumeEvents(newParent => newParent && newParent.context.get(HierarchyUpdates).on(updateParent)),
          );
          parentHierarchy.read(receiver);
          this.context.whenConnected({
            supply: new Supply().needs(supply),
            receive: updateParent,
          });
        },
    ).do(shareAfter);

    const parent = this._parent = trackValue<HierarchyContext>();

    context.whenConnected(noop).cuts(parent);

    const registry = this._registry = newHierarchyRegistry<T>(this.up);

    this.get = registry.newValues().get;
  }

  provide<TDeps extends any[], TSrc, TSeed>(
      spec: ContextValueSpec<HierarchyContext<T>, any, TDeps, TSrc, TSeed>,
  ): Supply {
    return this._registry.provide(spec).needs(this);
  }

  inside(enclosing?: ComponentContext): this {
    this._parent.it = enclosing && enclosing.get(HierarchyContext);
    return this;
  }

}
