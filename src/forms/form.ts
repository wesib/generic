import { InControl, inFormElement, InFormElement } from '@frontmeans/input-aspects';
import { ShareableByComponent } from '../share';
import { Field } from './field';
import { FormUnit } from './form-unit';

/**
 * User input form.
 *
 * A component {@link FormShare shares} form (e.g. using {@link SharedForm @SharedForm} decorator) to make its
 * accessible by component itself and nested ones. E.g. to add {@link Field fields} to it or submit it.
 *
 * A form may be nested within another one, as it implements a {@link Field} interface.
 *
 * The form instance is not usable until it is bound to its sharer component. The latter is done automatically when the
 * form is shared by {@link FormShare}.
 *
 * @typeParam TModel - A model type of the form, i.e. a type of its control value.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TSharer - Form sharer component type.
 */
export class Form<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = any>
    extends FormUnit<TModel, TSharer, Form.Controls<TModel, TElt>>
    implements Form.Controls<TModel, TElt> {

  /**
   * Builds a user input form for the given form control and HTML element.
   *
   * @param control - Submitted control. Typically a container one.
   * @param element - HTML element to create control for.
   * @param options - Form element control options.
   *
   * @returns New form instance.
   */
  static forElement<TModel, TElt extends HTMLElement>(
      control: InControl<TModel>,
      element: TElt,
      options?: Omit<InFormElement.Options, 'form'>,
  ): Form<TModel, TElt> {
    return new this<TModel, TElt>({
      control,
      element: inFormElement(element, { ...options, form: control }),
    });
  }

  /**
   * Form element control.
   *
   * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
   * element issuing a `submit` event.
   */
  get element(): InFormElement<TElt> {
    return this.internals.element;
  }

}

export namespace Form {

  /**
   * A model type of the given form.
   *
   * @typeParam TForm - Form type.
   */
  export type ModelType<TForm extends Form<any, any>> = FormUnit.ValueType<TForm>;

  /**
   * HTML form element type of the form.
   *
   * @typeParam TForm - Form type.
   */
  export type ElementType<TForm extends Form<any, any>> = TForm extends Form<any, infer TElt> ? TElt : never;

  /**
   * Form controls.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Controls<TModel, TElt extends HTMLElement> extends Field.Controls<TModel> {

    /**
     * Submittable form input control.
     */
    readonly control: InControl<TModel>;

    /**
     * Form element control.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InFormElement<TElt>;

  }

  /**
   * Form controls provider signature.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export type Provider<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = object> =
      ShareableByComponent.Provider<TSharer, Controls<TModel, TElt>>;

}
