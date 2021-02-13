import { InConverter, InNamespaceAliaser, InRenderScheduler, intoConvertedBy } from '@frontmeans/input-aspects';
import { ContextSupply, ContextValueSlot } from '@proc7ts/context-values';
import { contextDestroyed, ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import { AfterEvent, mapAfter, supplyAfter } from '@proc7ts/fun-events';
import { DefaultNamespaceAliaser, ElementRenderScheduler } from '@wesib/wesib';

/**
 * Form aspects. I.e. input aspects meant to be applied to form controls.
 *
 * @typeParam TValue - Input value type.
 */
export type FormAspects<TValue = any> = InConverter.Aspect<TValue>;

class FormAspectsKey extends ContextUpKey<FormAspects.Factory, FormAspects> {

  readonly upKey: ContextUpKey.SimpleUpKey<[FormAspects.Factory], FormAspects>;

  constructor() {
    super('form-aspects');
    this.upKey = this.createUpKey(slot => {

      const nsAlias = slot.context.get(DefaultNamespaceAliaser);
      const scheduler = slot.context.get(ElementRenderScheduler);

      slot.insert(slot.seed.do(
          mapAfter((...aspects) => intoConvertedBy(
              ...aspects,
              InRenderScheduler.to(scheduler),
              InNamespaceAliaser.to(nsAlias),
          )),
          supplyAfter(slot.context.get(ContextSupply)),
      ));
    });
  }

  grow(slot: ContextValueSlot<
      FormAspects.Factory,
      ContextUpKey.Source<FormAspects>,
      AfterEvent<FormAspects[]>>): void {

    let delegated: FormAspects.Factory;

    slot.context.get(this.upKey)(
        factory => delegated = factory,
    ).whenOff(
        reason => delegated = contextDestroyed(reason),
    );

    slot.insert((from, to) => delegated(from, to));
  }

}

export namespace FormAspects {

  /**
   * Form aspects factory signature.
   *
   * @typeParam TValue - Input value type.
   */
  export type Factory<TValue = unknown> = InConverter.Aspect.Factory<TValue>;

}

/**
 * A key of component context containing default form aspects.
 *
 * As a bare minimum it assigns the following aspects to converted controls:
 * - `InRenderScheduler` set to `ElementRenderScheduler`,
 * - `InNamespaceAliaser` set to `DefaultNamespaceAliaser.
 *
 * More input aspect converters may be registered in context. They may override the default ones.
 */
export const FormAspects: ContextUpRef<FormAspects.Factory<any>, FormAspects> = (
    /*#__PURE__*/ new FormAspectsKey()
);
