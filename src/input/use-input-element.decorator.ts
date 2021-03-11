import { InControl, InConverter } from '@frontmeans/input-aspects';
import { afterAll, afterThe, consumeEvents, digAfter, EventKeeper } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { ComponentNode, ElementNode, ElementPickMode } from '../tree';
import { DefaultInAspects } from './default-in-aspects';
import { inputFromControl } from './input-from-control';

/**
 * Constructs component decorator that finds input element and uses it as an {@link InputFromControl origin of user
 * input}.
 *
 * @typeParam T - A type of decorated component class.
 * @param def - Input element usage definition.
 *
 * @returns New component decorator.
 */
export function UseInputElement<T extends ComponentClass = Class>(
    def: UseInputElementDef<InstanceType<T>>,
): ComponentDecorator<T> {

  const { select = 'input', pick = { deep: true, all: true } } = def;

  return Component({
    define(defContext) {
      defContext.whenComponent(context => {

        const componentNode = context.get(ComponentNode);

        context.whenConnected(() => {
          afterAll({
            node: componentNode.select(select, pick).first,
            aspects: context.get(DefaultInAspects),
          }).do(
              digAfter(({
                node: [node],
                aspects: [aspects],
              }): EventKeeper<[InControl<any>?, Supply?]> => {
                if (!node) {
                  return afterThe();
                }

                const control = def.makeControl({ node, context, aspects });

                if (!control) {
                  return afterThe();
                }

                return control instanceof InControl ? afterThe(control) : control;
              }),
              consumeEvents((control?: InControl<any>, supply?: Supply) => {
                if (!control) {
                  return;
                }

                const usageSupply = inputFromControl(context, control);

                (supply || control.supply).needs(usageSupply);

                return usageSupply;
              }),
          );
        });
      });
    },
  });
}

/**
 * A definition of element to use as an {@link InputFromControl origin of user input}.
 *
 * Configures {@link UseInputElement @UseInputElement} component decorator.
 *
 * @typeParam T - A type of component.
 */
export interface UseInputElementDef<T extends object = any> {

  /**
   * CSS selector of input element to use.
   *
   * `input` by default.
   */
  readonly select?: string;

  /**
   * A mode of node picking from component tree.
   *
   * By default picks any matching element from entire subtree.
   */
  readonly pick?: ElementPickMode;

  /**
   * Constructs input control for element node found by {@link UseInputElement @UseInputElement} decorator.
   *
   * The returned control keeper may send an event supply as a second parameter. This supply will be cut off once
   * the input from control is no longer needed. Otherwise the control's input supply will be cut off instead,
   * and control would become unusable after that.
   *
   * @param node - Element node to construct input control for.
   * @param context - Component context the {@link UseInputElement @UseInputElement} decorator is applied to.
   * @param aspects - Default input aspect converter. This is a value of {@link DefaultInAspects}.
   *
   * @returns Either input control, its keeper, or nothing.
   */
  makeControl(
      {
        node,
        context,
        aspects,
      }: {
        node: ElementNode;
        context: ComponentContext<T>;
        aspects: InConverter.Aspect<any, any>;
      },
  ):
      | InControl<any>
      | EventKeeper<[InControl<any>?, Supply?]>
      | null
      | undefined;

}
