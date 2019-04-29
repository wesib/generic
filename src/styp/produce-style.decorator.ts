import { ComponentClass, ComponentDef } from '@wesib/wesib';
import { StypRule, StypRules } from 'style-producer';
import { ComponentStypOptions } from './component-styp-options';
import { StyleProducerSupport } from './style-producer-support.feature';

/**
 * A decorator of component property returning CSS rules to produce.
 *
 * Decorated property values should be of type `StypRules` or `StypRule`. In the latter case a `StypRule.rules` will
 * be used.
 *
 * This decorator automatically enables `StyleProducerSupport` feature.
 *
 * Utilizes `ComponentStypOptions.produce()` function to produce CSS stylesheets.
 *
 * @param options Non-mandatory CSS style production options.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<T extends ComponentClass>(options?: ComponentStypOptions):
    <V extends StypRule | StypRules>(
        target: InstanceType<T>,
        propertyKey: string | symbol,
        descriptor?: TypedPropertyDescriptor<V>) => any | void {
  return (target: InstanceType<T>, propertyKey: string | symbol) => {

    const componentType = target.constructor as T;

    ComponentDef.define(
        componentType,
        {
          define(defContext) {
            defContext.onComponent(componentContext => {
              componentContext.whenReady(() => {

                const component = componentContext.component as any;

                ComponentStypOptions.produce(componentContext, component[propertyKey], options);
              });
            });
          },
          feature: {
            needs: [StyleProducerSupport],
          },
        });
  };
}
