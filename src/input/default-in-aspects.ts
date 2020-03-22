/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { ContextKey__symbol, ContextValueOpts, ContextValues } from '@proc7ts/context-values';
import { ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import { afterAll, AfterEvent, EventKeeper } from '@proc7ts/fun-events';
import { InConverter, InNamespaceAliaser, InRenderScheduler, intoConvertedBy } from '@proc7ts/input-aspects';
import { DefaultNamespaceAliaser, DefaultRenderScheduler } from '@wesib/wesib';

/**
 * Default input aspects.
 *
 * This is an `AfterEvent` keeper of aspect converter meant to be applied to controls.
 *
 * As a bare minimum it assigns the following aspects to converted controls:
 * - `InRenderScheduler` set to `DefaultRenderScheduler`,
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

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          AfterEvent<[InConverter.Aspect<any, any>]>,
          EventKeeper<InConverter.Aspect<any, any>[]> | InConverter.Aspect<any, any>,
          AfterEvent<InConverter.Aspect<any, any>[]>>,
  ): AfterEvent<[InConverter.Aspect.Factory<any, any>]> {

    const nsAlias = opts.context.get(DefaultNamespaceAliaser);

    return afterAll({
      scheduler: opts.context.get(DefaultRenderScheduler[ContextKey__symbol].upKey),
      fns: opts.seed,
    }).keepThru(
        ({
            scheduler: [scheduler],
            fns,
        }) => intoConvertedBy(
            ...fns,
            InRenderScheduler.to(scheduler),
            InNamespaceAliaser.to(nsAlias),
        ),
    );
  }

}

/**
 * A key of bootstrap, definition, or component context containing default input aspects.
 */
export const DefaultInAspects: ContextUpRef<DefaultInAspects, InConverter.Aspect<any, any>> = (
    /*#__PURE__*/ new DefaultInAspectsKey()
);
