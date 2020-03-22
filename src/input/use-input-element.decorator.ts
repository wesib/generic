/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { nextArgs, NextCall } from '@proc7ts/call-thru';
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
    def: UseInputElementDef<InstanceType<T>>,
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
            node: componentNode.select(select, pick).first(),
            aspects: context.get(DefaultInAspects),
          }).keepThru(({
            node: [node],
            aspects: [aspects],
          }): NextCall<OnEventCallChain, [InControl<any>?, EventSupply?]> => {
            if (!node) {
              return nextArgs();
            }

            const control = def.makeControl({ node, context, aspects });

            if (!control) {
              return nextArgs();
            }

            return control instanceof InControl ? nextArgs(control) : nextAfterEvent(control);
          }).tillOff(connectSupply).consume(
              (control?: InControl<any>, supply?: EventSupply) => {
                if (!control) {
                  return;
                }

                const usageSupply = inputFromControl(context, control);

                (supply || eventSupplyOf(control)).needs(usageSupply);

                return usageSupply;
              },
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
   * the input from control is no longer needed. Otherwise the control's input supply will be cut off instead,
   * and control would become unusable after that.
   *
   * @param node  Element node to construct input control for.
   * @param context  Component context the {@link UseInputElement @UseInputElement} decorator is applied to.
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
  ):
      | InControl<any>
      | EventKeeper<[InControl<any>?, EventSupply?]>
      | null
      | undefined;

}
