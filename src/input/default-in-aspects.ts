import { InConverter, InNamespaceAliaser, InRenderScheduler, intoConvertedBy } from '@frontmeans/input-aspects';
import { ContextSupply, ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import { AfterEvent, EventKeeper, mapAfter, supplyAfter } from '@proc7ts/fun-events';
import { DefaultNamespaceAliaser, ElementRenderScheduler } from '@wesib/wesib';

/**
 * Default input aspects.
 *
 * This is an `AfterEvent` keeper of aspect converter meant to be applied to controls.
 *
 * As a bare minimum it assigns the following aspects to converted controls:
 * - `InRenderScheduler` set to `ElementRenderScheduler`,
 * - `InNamespaceAliaser` set to `DefaultNamespaceAliaser.
 *
 * More input aspect converters may be registered in context. They may override the default ones.
 */
export type DefaultInAspects = AfterEvent<[InConverter.Aspect<any, any>]>;

/**
 * @internal
 */
class DefaultInAspectsKey
    extends ContextUpKey<AfterEvent<[InConverter.Aspect<any, any>]>, InConverter.Aspect<any, any>> {

  get upKey(): this {
    return this;
  }

  constructor() {
    super('default-in-aspects');
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[InConverter.Aspect<any, any>]>,
          EventKeeper<InConverter.Aspect<any, any>[]> | InConverter.Aspect<any, any>,
          AfterEvent<InConverter.Aspect<any, any>[]>>,
  ): void {

    const nsAlias = slot.context.get(DefaultNamespaceAliaser);
    const scheduler = slot.context.get(ElementRenderScheduler);

    slot.insert(
        slot.seed.do(
            mapAfter((...fns) => intoConvertedBy(
                ...fns,
                InRenderScheduler.to(scheduler),
                InNamespaceAliaser.to(nsAlias),
            )),
            supplyAfter(slot.context.get(ContextSupply)),
        ),
    );
  }

}

/**
 * A key of component context containing default input aspects.
 */
export const DefaultInAspects: ContextUpRef<DefaultInAspects, InConverter.Aspect<any, any>> = (
    /*#__PURE__*/ new DefaultInAspectsKey()
);
