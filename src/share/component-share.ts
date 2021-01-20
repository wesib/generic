import { ContextKey__symbol } from '@proc7ts/context-values';
import { SingleContextUpKey, SingleContextUpRef } from '@proc7ts/context-values/updatable';
import { afterAll, AfterEvent, digAfter_, EventKeeper, trackValue, translateAfter } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import {
  BootstrapContext,
  ComponentClass,
  ComponentContext,
  ComponentDef,
  ComponentElement,
  ComponentProperty,
  ComponentPropertyDecorator,
  ComponentSlot,
  DefinitionContext,
  DefinitionSetup,
} from '@wesib/wesib';
import { ComponentShareRegistry } from './component-share-registry';

export interface ComponentShare<
    TValue,
    TOpts extends any[] = [],
    TClass extends ComponentClass = Class>
    extends ComponentShare.Ref<TValue> {

  (...opts: TOpts): ComponentPropertyDecorator<ComponentShare.Value<TValue>, TClass>;

  shareFor(consumer: ComponentContext): AfterEvent<[TValue?]>;

}

export namespace ComponentShare {

  export type Ref<TValue> = SingleContextUpRef<TValue | undefined>;

  /**
   * A type of the value of component property that builds a share.
   *
   * @typeParam TValue - Shared value type.
   */
  export type Value<TValue> = TValue | EventKeeper<[TValue?]>;

}

/**
 * Component share definition.
 *
 * @typeParam TValue - Shared value type.
 * @typeParam TOpts - C
 * @typeParam TClass - A type of sharing component class.
 */
export interface ComponentShareDef<TValue, TOpts extends any[] = [], TClass extends ComponentClass = Class> {

  readonly key: ComponentShare.Ref<TValue>;

  define?(
      descriptor: ComponentProperty.Descriptor<ComponentShare.Value<TValue>, TClass>,
      ...opts: TOpts
  ): void | ComponentProperty.Definition<TValue, TClass>;

}

export function ComponentShare<TValue, TOpts extends any[], TClass extends ComponentClass>(
    def: ComponentShareDef<TValue, TOpts, TClass>,
): ComponentShare<TValue, TOpts, TClass> {

  type Share = ((...opts: TOpts) => ComponentPropertyDecorator<ComponentShare.Value<TValue>, TClass>) & {
    -readonly [K in keyof ComponentShare<TValue, TOpts, TClass>]: ComponentShare<TValue, TOpts, TClass>[K];
  };

  const { key = new SingleContextUpKey<TValue | undefined>('share') } = def;
  const createDeco = (
      ...opts: TOpts
  ): ComponentPropertyDecorator<ComponentShare.Value<TValue>, TClass> => ComponentProperty(descriptor => {
    ComponentDef.define(
        descriptor.type,
        {
          setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
            setup.perComponent({
              a: key,
              by(ctx: ComponentContext<InstanceType<TClass>>): ComponentShare.Value<TValue> {
                return ctx.component[descriptor.key];
              },
            });
          },
          define(defContext: DefinitionContext<InstanceType<TClass>>) {

            const { name } = defContext.elementDef;

            if (name) {
              defContext.get(ComponentShareRegistry)
                  .addSharer(createDeco as ComponentShare<TValue, TOpts, TClass>, defContext);
            }
          },
        },
    );

    return def.define?.(descriptor, ...opts);
  });

  const share = createDeco as Share;

  share[ContextKey__symbol] = key[ContextKey__symbol];
  share.shareFor = ComponentShare$shareFor;

  return share;
}

function ComponentShare$shareFor<TValue, TOpts extends any[], TClass extends ComponentClass>(
    this: ComponentShare<TValue, TOpts, TClass>,
    consumer: ComponentContext,
): AfterEvent<[TValue?]> {

  const sharers = consumer.get(BootstrapContext).get(ComponentShareRegistry).sharers(this);
  const status = trackValue<boolean>();
  const updateStatus = ({ connected }: ComponentContext): void => {
    status.it = connected;
  };

  consumer.whenSettled(updateStatus);
  consumer.whenConnected(updateStatus);
  status.supply.needs(consumer);

  let lastValue: TValue | null | undefined = null;

  return afterAll({
    sharers,
    status,
  }).do(
      digAfter_(({ sharers: [names] }): AfterEvent<[TValue?]> | undefined => {

        let element: ComponentElement = consumer.element;

        for (;;) {

          const parent = element.parentNode as ComponentElement | null
              || (element.getRootNode() as ShadowRoot).host as ComponentElement | undefined; // Inside shadow DOM?

          if (!parent) {
            return;
          }
          if (names.has(parent.tagName.toLowerCase())) {
            return ComponentSlot.of(element).read.do(
                digAfter_(sharerContext => sharerContext && sharerContext.get(this)),
            );
          }

          element = parent;
        }
      }),
      translateAfter((send, value) => {
        if (lastValue !== value) {
          lastValue = value;
          send(value);
        }
      }),
  );
}
