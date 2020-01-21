/**
 * @module @wesib/generic
 */
import { DefaultNamespaceAliaser, DefaultRenderScheduler } from '@wesib/wesib';
import { ContextKey__symbol, ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { afterAll, AfterEvent, EventKeeper } from 'fun-events';
import { InConverter, InNamespaceAliaser, InRenderScheduler, intoConvertedBy } from 'input-aspects';

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
    }).keep.thru(
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
