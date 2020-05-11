/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { nextArgs, NextCall } from '@proc7ts/call-thru';
import { afterAll, EventKeeper, EventSupply, nextAfterEvent, OnEventCallChain } from '@proc7ts/fun-events';
import { InControl, InConverter, InFormElement } from '@proc7ts/input-aspects';
import { Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { ComponentNode, ElementNode, ElementPickMode } from '../tree';
import { DefaultInAspects } from './default-in-aspects';
import { inputToForm } from './input-to-form';

/**
 * Constructs component decorator that finds form element to {@link InputToForm fill by user input}.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Form element fill definition.
 *
 * @returns New component decorator.
 */
export function FillInputForm<T extends ComponentClass = Class>(
    def: FillInputFormDef<InstanceType<T>>,
): ComponentDecorator<T> {

  const { select = 'form', pick = { deep: true, all: true } } = def;

  return Component({
    define(defContext) {
      defContext.whenComponent(context => {

        const componentNode = context.get(ComponentNode);

        context.whenConnected(() => {
          afterAll({
            node: componentNode.select(select, pick).first(),
            aspects: context.get(DefaultInAspects),
          }).keepThru(({
            node: [node],
            aspects: [aspects],
          }): NextCall<OnEventCallChain, [InControl<any>, InFormElement, EventSupply?] | []> => {
            if (!node) {
              return nextArgs();
            }

            const tuple = def.makeForm({ node, context, aspects });

            if (!tuple) {
              return nextArgs();
            }

            return Array.isArray(tuple) ? nextArgs(...tuple) : nextAfterEvent(tuple);
          }).consume(
              (control?, form?, supply?) => {
                if (!control) {
                  return;
                }

                const fillSupply = inputToForm(context, control, form!);

                if (supply) {
                  supply.needs(fillSupply);
                } else {
                  fillSupply.cuts(form!).cuts(control);
                }

                return fillSupply;
              },
          );
        });
      });
    },
  });
}

/**
 * A definition of form element to {@link InputToForm fill by user input}.
 *
 * Configures {@link FillInputForm @FillInputForm} component decorator.
 *
 * @typeparam T  A type of component.
 */
export interface FillInputFormDef<T extends object = any> {

  /**
   * CSS selector of form element to fill.
   *
   * `form` by default.
   */
  readonly select?: string;

  /**
   * A mode of node picking from component tree.
   *
   * By default picks any matching element from entire subtree.
   */
  readonly pick?: ElementPickMode;

  /**
   * Constructs form control and form element control for element node found by {@link FillInputForm @FillInputForm}
   * decorator.
   *
   * The returned control keeper may send an event supply as a third parameter. This supply will be cut off once
   * the form filling is no longer needed. Otherwise the form's control supply will be cut off instead,
   * and it would become unusable after that.
   *
   * @param node  Element node to construct form element control for.
   * @param context  Component context the {@link FillInputForm @FillInputForm} decorator is applied to.
   * @param aspects  Default input aspect converter. This is a value of [[DefaultInAspects]].
   *
   * @returns Either form control and form element control tuple, their keeper, or nothing.
   */
  makeForm(
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
      | [InControl<any>, InFormElement]
      | EventKeeper<[InControl<any>, InFormElement, EventSupply?] | []>
      | null
      | undefined;

}
