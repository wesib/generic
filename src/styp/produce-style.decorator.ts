/**
 * @module @wesib/generic
 */
import { ComponentClass, ComponentDef } from '@wesib/wesib';
import { StypRules } from 'style-producer';
import { BasicStyleProducerSupport } from './basic-style-producer-support.feature';
import { ComponentStypOptions } from './component-styp-options';

/**
 * A decorator of component property returning CSS rules to produce.
 *
 * Decorated property value should either contain a CSS rules source of type `StypRules.Source` or be a method
 * returning it.
 *
 * This decorator automatically enables [[BasicStyleProducerSupport]] feature.
 *
 * Utilizes [[ComponentStypOptions.produce]] function to produce CSS stylesheets.
 *
 * @typeparam T  A type of decorated component class.
 * @param options  Non-mandatory CSS style production options.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<T extends ComponentClass>(
    options?: ComponentStypOptions,
): <V extends StypRules.Source | (() => StypRules.Source)>(
    target: InstanceType<T>,
    propertyKey: string | symbol,
    descriptor?: TypedPropertyDescriptor<V>,
) => any | void {
  return (target: InstanceType<T>, propertyKey: string | symbol) => {

    const componentType = target.constructor as T;

    ComponentDef.define(
        componentType,
        {
          define(defContext) {
            defContext.onComponent(componentContext => {
              componentContext.whenReady(({ component }) => {

                const property = component[propertyKey];

                ComponentStypOptions.produce(
                    componentContext,
                    typeof property === 'function' ? property.bind(component) : property,
                    options,
                );
              });
            });
          },
          feature: {
            needs: [BasicStyleProducerSupport],
          },
        },
    );
  };
}
