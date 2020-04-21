/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { StypRule, StypRules } from '@proc7ts/style-producer';
import { ComponentClass, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { BasicStyleProducerSupport } from './basic-style-producer-support.feature';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * A decorator of component property returning CSS rules to produce.
 *
 * Decorated property value should either contain a CSS rules source of type `StypRules.Source` or be a method
 * returning it.
 *
 * This decorator automatically enables [[BasicStyleProducerSupport]] feature.
 *
 * Produces CSS using {@link ComponentStypFormat component style production format}.
 *
 * @typeparam T  A type of decorated component class.
 * @param config  Non-mandatory component style production format config.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<T extends ComponentClass>(
    config?: ComponentStypFormatConfig,
): ComponentPropertyDecorator<
    | StypRules.Source
    | (() => StypRule | StypRules | Promise<StypRule | StypRules>),
    T> {
  return ComponentProperty(({ get }) => ({
    componentDef: {
      feature: {
        needs: BasicStyleProducerSupport,
      },
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(({ component }) => {

            const value = get(component);
            const source: StypRules.Source = typeof value === 'function' ? value.bind(component) : value;
            const format = context.get(ComponentStypFormat);

            format.produce(source, config);
          });
        });
      },
    },
  }));
}
