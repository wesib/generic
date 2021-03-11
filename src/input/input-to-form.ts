import { InControl, InFormElement } from '@frontmeans/input-aspects';
import { SingleContextUpKey, SingleContextUpRef } from '@proc7ts/context-values/updatable';
import { Supply } from '@proc7ts/supply';
import { ComponentContext } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl } from './input-from-control';

/**
 * A form control to fill by user input.
 *
 * An {@link inputToForm} function can be used to initiate filling the form.
 *
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 */
export interface InputToForm<TModel = any, TElt extends HTMLElement = HTMLElement> extends InputFromControl<TModel> {

  /**
   * Input form element control.
   *
   * Unlike input form control this one is not supposed to be submitted. But it contains a `<form>` element issuing a
   * `submit` event.
   */
  readonly form: InFormElement<TElt>;

}

/**
 * No user input filling the form.
 */
export interface NoInputToForm {
  control?: undefined;
  form?: undefined;
}

/**
 * A key of hierarchy context value containing a form element to fill by user input. Potentially
 * {@link NoInputToForm absent}.
 */
export const InputToForm: SingleContextUpRef<InputToForm<any, any> | NoInputToForm> = (
    /*#__PURE__*/ new SingleContextUpKey<InputToForm<any, any> | NoInputToForm>(
        'input-to-form',
        {
          byDefault: () => ({}),
        },
    )
);

/**
 * Initiates filling the form by user input from.
 *
 * Constructs {@link InputToForm} and {@link InputFromControl} instances and makes them available in `root` component's
 * hierarchy.
 *
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @param root - Root component context to initiate user input for.
 * @param control - Input form control.
 * @param form - Form element control.
 *
 * @returns Form fill supply. The form filling would be stopped once this supply is cut off.
 */
export function inputToForm<TModel, TElt extends HTMLElement>(
    root: ComponentContext,
    control: InControl<TModel>,
    form: InFormElement<TElt>,
): Supply {

  const hierarchy = root.get(HierarchyContext);
  const supply = hierarchy.provide({
    a: InputToForm,
    by: () => ({
      root,
      control,
      form,
    }),
  });

  hierarchy.provide({
    a: InputFromControl,
    via: InputToForm,
  }).needs(supply);

  return supply
      .needs(root)
      .needs(control)
      .needs(form);
}

