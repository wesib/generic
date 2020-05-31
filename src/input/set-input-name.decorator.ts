/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { nextArg } from '@proc7ts/call-thru';
import { afterAll, afterThe, EventKeeper, nextAfterEvent } from '@proc7ts/fun-events';
import { InGroup } from '@proc7ts/input-aspects';
import { Class, valueProvider } from '@proc7ts/primitives';
import { Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl, NoInputFromControl } from './input-from-control';

/**
 * Creates component decorator that adds {@link InputFromControl input control} of decorated component to input control
 * group of enclosing one under the given name.
 *
 * @typeparam T  A type of decorated component class.
 * @param name  A name to assign to component. This could be either a string, or a function returning name as a string
 * or as its keeper.
 *
 * @returns New component decorator.
 */
export function SetInputName<T extends ComponentClass = Class>(
    name: string | ((this: void, context: ComponentContext<InstanceType<T>>) => string | EventKeeper<[string?]>),
): ComponentDecorator<T> {

  const getName: (context: ComponentContext<InstanceType<T>>) => EventKeeper<[string?]> = typeof name === 'string'
      ? valueProvider(afterThe(name))
      : context => {
        const result = name(context);
        return typeof result === 'string' ? afterThe(result) : result;
      };

  return Component({
    define(defContext) {
      defContext.whenComponent(context => {

        const hierarchy = context.get(HierarchyContext);

        afterAll({
          group: hierarchy.up().keepThru_(
              upper => upper ? nextAfterEvent(upper.get(InputFromControl)) : nextArg<NoInputFromControl>({}),
              ({ control }) => control && control.aspect(InGroup),
          ),
          control: hierarchy.get(InputFromControl),
          name: getName(context),
        }).consume(
            ({
              group: [group],
              control: [{ control }],
              name: [name],
            }) => {
              if (name == null
                  || !group
                  || !control
                  || group === control) {
                return;
              }
              return group.controls.set(name, control);
            },
        );
      });
    },
  });
}
