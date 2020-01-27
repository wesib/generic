import { Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { valueProvider } from 'call-thru';
import { afterAll, afterThe, EventKeeper, eventSupply } from 'fun-events';
import { InGroup } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl, InputFromNowhere } from './input-from-control';

/**
 * Creates component decorator that adds {@link InputFromControl input control} of decorated component to input control
 * group of enclosing one under the given name.
 *
 * @param name  A name to assign to component. This could be either a string, or a function returning name as a string
 * or as its keeper.
 *
 * @returns New component decorator.
 */
export function SetInputName<T extends ComponentClass = Class>(
    name: string | ((this: void, context: ComponentContext) => string | EventKeeper<[string?]>),
): ComponentDecorator<T> {

  const getName: (context: ComponentContext) => EventKeeper<[string?]> = typeof name === 'string'
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
          group: hierarchy.up.keep.dig_(
              upper => upper ? upper.get(InputFromControl) : afterThe<[InputFromNowhere]>({}),
          ).keep.thru_(
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

              const supply = eventSupply(() => group.controls.remove(name));

              group.controls.set(name, control);

              return supply;
            },
        );
      });
    },
  });
}
