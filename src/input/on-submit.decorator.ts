/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { DomEventDispatcher, handleDomEvents } from '@frontmeans/dom-events';
import { consumeEvents } from '@proc7ts/fun-events';
import { ComponentClass, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { InputToForm, NoInputToForm } from './input-to-form';

/**
 * Creates a decorator for component method to call on input form submit.
 *
 * The decorated method accepts a {@link InputToForm filled input form} and submit event as parameters.
 *
 * @typeParam T - A type of decorated component class.
 * @typeParam TModel - Submitted model type.
 * @typeParam TElt - A type of HTML form element.
 * @param def - Submit handler definition.
 *
 * @returns New component property decorator.
 */
export function OnSubmit<T extends ComponentClass, TModel = any, TElt extends HTMLElement = HTMLElement>(
    def: OnSubmitDef = {},
): ComponentPropertyDecorator<(form: InputToForm<TModel, TElt>, event: Event) => void, T> {

  const { cancel = true } = def;

  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenConnected(() => {

            const hierarchy = context.get(HierarchyContext);
            const { component } = context;

            hierarchy.get(InputToForm).do(consumeEvents((inputToForm: InputToForm<TModel, TElt> | NoInputToForm) => {
              if (!inputToForm.control) {
                return;
              }

              const submitDispatcher = new DomEventDispatcher(inputToForm.form.element);

              submitDispatcher.supply.needs(context);

              const onSubmit = submitDispatcher.on('submit');

              return (cancel ? onSubmit.do(handleDomEvents(false)) : onSubmit)(
                  event => get(component).call(component, inputToForm, event),
              );
            }));
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
