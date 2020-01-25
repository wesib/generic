import { Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { afterAll, afterThe, EventKeeper, eventSupply, isEventKeeper } from 'fun-events';
import { InControl, InConverter } from 'input-aspects';
import { ComponentNode, ComponentTreeSupport, ElementNode, ElementPickMode } from '../tree';
import { DefaultInAspects } from './default-in-aspects';
import { inputFromControl } from './input-from-control';

/**
 * Constructs component decorator that finds input element and uses it as an {@link InputFromControl origin of user
 * input}.
 *
 * Enables [[ComponentTreeSupport]] feature.
 *
 * @param select  CSS selector of input element to use. `input` by default.
 * @param pick  A mode of node picking from component tree.
 * @param makeControl  Input control constructor. This function acce
 *
 * @returns New component decorator.
 */
export function UseInputElement<T extends ComponentClass = Class>(
    {
      select = 'input',
      pick = { deep: true, all: true },
      makeControl,
    }: {
      readonly select?: string;
      readonly pick?: ElementPickMode;
      readonly makeControl: UseInputElement.MakeControl;
    },
): ComponentDecorator<T> {
  return Component({
    feature: {
      needs: ComponentTreeSupport,
    },
    define(defContext) {
      defContext.whenComponent(context => {

        const componentNode = context.get(ComponentNode);

        context.whenOn(connectSupply => {
          afterAll({
            node: componentNode.select(select, pick).first,
            aspects: context.get(DefaultInAspects),
          }).keep.dig(({
            node: [node],
            aspects: [aspects],
          }) => {
            if (!node) {
              return afterThe<[InControl<any>?]>();
            }

            const control = makeControl({ node, context, aspects });

            if (!control) {
              return afterThe<[InControl<any>?]>();
            }

            return isEventKeeper(control) ? control : afterThe(control);
          }).consume(
              control => {
                if (!control) {
                  return;
                }

                const supply = eventSupply();

                inputFromControl(context, control).needs(supply);

                return supply;
              },
          ).needs(connectSupply);
        });
      });
    },
  });
}

export namespace UseInputElement {

  /**
   * Input control constructor signature.
   *
   * Constructs input control for element node found by {@link UseInputElement @UseInputElement} decorator.
   */
  export type MakeControl =
  /**
   * @param node  Element node to construct input control for.
   * @param context  Component context the `@UseInputElement` decorator is applied to.
   * @param aspects  Default input aspect converter. This is a value of `DefaultInputAspect`.
   *
   * @returns Either input control, its keeper, or nothing.
   */
      (
          this: void,
          {
            node,
            context,
            aspects,
          }: {
            node: ElementNode;
            context: ComponentContext;
            aspects: InConverter.Aspect<any, any>;
          },
      ) => InControl<any> | EventKeeper<[InControl<any>?]> | null | undefined;

}
