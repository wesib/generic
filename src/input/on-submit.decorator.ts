/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { ComponentClass, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { eventSupplyOf } from 'fun-events';
import { DomEventDispatcher } from 'fun-events/dom';
import { HierarchyContext } from '../hierarchy';
import { InputToForm, NoInputToForm } from './input-to-form';

/**
 * Creates a decorator for component method to call on input form submit.
 *
 * The decorated method accepts a {@link InputToForm filled input form} and submit event as parameters.
 *
 * @typeparam T  A type of decorated component class.
 * @typeparam M  Submitted value type.
 * @typeparam Elt  A type of HTML form element.
 * @param def  Submit handler definition.
 *
 * @returns New component property decorator.
 */
export function OnSubmit<T extends ComponentClass, Model = any, Elt extends HTMLElement = HTMLElement>(
    def: OnSubmitDef = {},
): ComponentPropertyDecorator<(form: InputToForm<Model, Elt>, event: Event) => void, T> {

  const { cancel = true } = def;

  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenOn(supply => {

            const hierarchy = context.get(HierarchyContext);
            const { component } = context;

            hierarchy.get(InputToForm).consume((inputToForm: InputToForm<Model, Elt> | NoInputToForm) => {
              if (!inputToForm.control) {
                return;
              }

              const submitDispatcher = new DomEventDispatcher(inputToForm.form.element);

              eventSupplyOf(submitDispatcher).needs(supply);

              const onSubmit = submitDispatcher.on('submit');

              return (cancel ? onSubmit.instead : onSubmit)(
                  event => get(component).call(component, inputToForm, event),
              );
            });
          });
        });
      },
    },
  }));
}

/**
 * Form submit handler definition.
 *
 * Configures {@link OnSubmit @OnSubmit} component property decorator.
 */
export interface OnSubmitDef {

  /**
   * Whether to cancel default submit handler.
   *
   * `true` by default.
   */
  cancel?: boolean;

}
