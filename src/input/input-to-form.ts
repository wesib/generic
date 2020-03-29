/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { SingleContextUpKey, SingleContextUpRef } from '@proc7ts/context-values/updatable';
import { eventSupply, EventSupply } from '@proc7ts/fun-events';
import { InControl, InFormElement } from '@proc7ts/input-aspects';
import { ComponentContext } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl } from './input-from-control';

/**
 * A form control to fill by user input.
 *
 * An [[inputToForm]] function can be used to initiate filling the form.
 *
 * @typeparam Model  Form model type.
 * @typeparam Elt  A type of HTML form element.
 */
export interface InputToForm<Model = any, Elt extends HTMLElement = HTMLElement> extends InputFromControl<Model> {

  /**
   * Input form element control.
   *
   * Unlike input form control this one is not supposed to be submitted. But it contains a `<form>` element issuing a
   * `submit` event.
   */
  readonly form: InFormElement<Elt>;

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
 * Constructs [[InputToForm]] and [[InputFromControl]] instances and makes them available in `root` component's
 * hierarchy.
 *
 * @typeparam Model  Form model type.
 * @typeparam Elt  A type of HTML form element.
 * @param root  Root component context to initiate user input for.
 * @param control  Input form control.
 * @param form  Form element control.
 *
 * @returns Form fill supply. The form filling would be stopped once this supply is cut off.
 */
export function inputToForm<Model, Elt extends HTMLElement>(
    root: ComponentContext,
    control: InControl<Model>,
    form: InFormElement<Elt>,
): EventSupply {

  const hierarchy = root.get(HierarchyContext);
  const off = hierarchy.provide({
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
  });

  return eventSupply(off)
      .needs(root)
      .needs(control)
      .needs(form);
}

