import { InControl, inFormElement, InFormElement } from '@frontmeans/input-aspects';
import { Field } from './field';

/**
 * User input form.
 */
export class Form<TModel = any, TElt extends HTMLElement = HTMLElement> extends Field<TModel> {

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
    return new Form<TModel, TElt>(control, inFormElement(element, { ...options, form: control }));
  }

  /**
   * Form element control.
   *
   * Unlike {@link input input control} this one is not supposed to be submitted. But it contains a `<form>` element
   * issuing a `submit` event.
   */
  readonly element: InFormElement<TElt>;

  constructor(control: InControl<TModel>, element: InFormElement<TElt>) {
    super(control);
    this.element = element;
  }

}
