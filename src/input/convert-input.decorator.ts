/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { nextArg, nextArgs, NextCall } from '@proc7ts/call-thru';
import {
  afterAll,
  EventKeeper,
  EventSupply,
  eventSupplyOf,
  nextAfterEvent,
  OnEventCallChain,
} from '@proc7ts/fun-events';
import { InControl, InConverter } from '@proc7ts/input-aspects';
import { Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { DefaultInAspects } from './default-in-aspects';
import { inputFromControl, InputFromControl, NoInputFromControl } from './input-from-control';

/**
 * Constructs component decorator that converts input control from {@link HierarchyContext.up enclosing component}
 * and uses it as an {@link InputFromControl origin of user input} in decorated component.
 *
 * @param convert  Input control converter definition.
 *
 * @returns New component decorator.
 */
export function ConvertInput<T extends ComponentClass = Class>(
    convert: ConvertInputDef<InstanceType<T>>,
): ComponentDecorator<T> {
  return Component({
    define(defContext) {
      defContext.whenComponent(context => {

        const { up } = context.get(HierarchyContext);

        afterAll({
          parent: up().keepThru_(
              upper => upper ? nextAfterEvent(upper.get(InputFromControl)) : nextArg<NoInputFromControl>({}),
          ),
          aspects: context.get(DefaultInAspects),
        }).keepThru_(
            ({
              parent: [control],
              aspects: [aspects],
            }): NextCall<OnEventCallChain, [InControl<any>?, EventSupply?]> => {
              if (control.control) {

                const converted = convert({ control, context, aspects });

                if (converted) {
                  return converted instanceof InControl
                      ? nextArgs(converted)
                      : nextAfterEvent(converted);
                }
              }

              return nextArgs();
            },
        ).consume(
            (control?: InControl<any> | null, supply?: EventSupply) => {
              if (!control) {
                return;
              }

              const usageSupply = inputFromControl(context, control);

              (supply || eventSupplyOf(control)).needs(usageSupply);

              return usageSupply;
            },
        );
      });
    },
  });
}

/**
 * Converter definition of enclosing component's user input control.
 *
 * The returned converted control keeper may send an event supply as a second parameter. This supply will be cut off
 * once the input from converted control is no longer needed. Otherwise the control's input supply will be cut off
 * instead, and control would become unusable after that.
 *
 * Configures {@link ConvertInput @ConvertInput} component decorator.
 */
export type ConvertInputDef<T extends object = any> =
/**
 * @param control  Enclosing component's user input to convert.
 * @param context  Decorated component context.
 * @param aspects  Default input aspect converter. This is a value of [[DefaultInAspects]].
 *
 * @returns Either input control, its keeper, or nothing.
 */
    (
        this: void,
        {
          control,
          context,
          aspects,
        }: {
          control: InputFromControl;
          context: ComponentContext<T>;
          aspects: InConverter.Aspect<any, any>;
        },
    ) => InControl<any> | EventKeeper<[InControl<any>?, EventSupply?]> | null | undefined;
