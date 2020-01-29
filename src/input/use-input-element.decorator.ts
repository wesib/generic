/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { afterAll, afterThe, EventKeeper, EventSupply } from 'fun-events';
import { InControl, InConverter, InSupply } from 'input-aspects';
import { ComponentNode, ComponentTreeSupport, ElementNode, ElementPickMode } from '../tree';
import { DefaultInAspects } from './default-in-aspects';
import { inputFromControl } from './input-from-control';

/**
 * Constructs component decorator that finds input element and uses it as an {@link InputFromControl origin of user
 * input}.
 *
 * Enables [[ComponentTreeSupport]] feature.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Input element usage definition.
 *
 * @returns New component decorator.
 */
export function UseInputElement<T extends ComponentClass = Class>(
    def: UseInputElementDef,
): ComponentDecorator<T> {

  const { select = 'input', pick = { deep: true, all: true } } = def;

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
              return afterThe();
            }

            const control = def.makeControl({ node, context, aspects });

            if (!control) {
              return afterThe();
            }

            return control instanceof InControl ? afterThe(control) : control;
          }).consume(
              (control?: InControl<any>, supply?: EventSupply) => {
                if (!control) {
                  return;
                }

                const usageSupply = inputFromControl(context, control);

                (supply || control.aspect(InSupply)).needs(usageSupply);

                return usageSupply;
              },
          ).needs(connectSupply);
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
 * @typeparam T  A type of component.
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
   * the input from control is no longer needed. Otherwise the control's input supply (`InSupply`) will be cut off
   * instead, and control would become unusable after that.
   *
   * @param node  Element node to construct input control for.
   * @param context  Component context the `@UseInputElement` decorator is applied to.
   * @param aspects  Default input aspect converter. This is a value of [[DefaultInputAspect]].
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
  ): InControl<any> | EventKeeper<[InControl<any>?, EventSupply?]> | null | undefined;

}
