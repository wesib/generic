import { ComponentClass, ComponentDef } from '@wesib/wesib';
import { StypOptions, StypRule, StypRules } from 'style-producer';
import { ComponentStyleProducer } from './component-style-producer';
import { StyleProducerSupport } from './style-producer-support.feature';

/**
 * A decorator of component property returning CSS rules to produce.
 *
 * Decorated property values should be of type `StypRules` or `StypRule`. In the latter case a `StypRule.rules` will
 * be used.
 *
 * This decorator automatically enables `StyleProducerSupport` feature.
 *
 * @param opts Non-mandatory CSS style production options.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<T extends ComponentClass>(opts?: StypOptions):
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
                const produceStyle = componentContext.get(ComponentStyleProducer);

                componentContext.onConnect(() => {
                  produceStyle(toStypRules(component[propertyKey] as any), opts);
                });
              });
            });
          },
          feature: {
            needs: [StyleProducerSupport],
          },
        });
  };
}

function toStypRules(styleDef: StypRule | StypRules): StypRules {
  if (styleDef instanceof StypRule) {
    return styleDef.rules;
  }
  return styleDef;
}
