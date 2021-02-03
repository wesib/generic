import { InControl, inFormElement, InFormElement } from '@frontmeans/input-aspects';
import { Field } from './field';

const Form$element__symbol = (/*#__PURE__*/ Symbol('Form.element'));

/**
 * User input form.
 *
 * A component {@link FormShare shares} form (e.g. using {@link SharedForm @SharedForm} decorator) to make its
 * accessible by component itself and nested ones. E.g. to add {@link Field fields} to it or submit it.
 *
 * A form may be nested within another one, as it implements a {@link Field} interface.
 *
 * @typeParam TModel - A model type of the form, i.e. a type of its control value.
 * @typeParam TElt - A type of HTML form element.
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
   * @internal
   */
  private readonly [Form$element__symbol]: InFormElement<TElt>;

  /**
   * Constructs a form.
   *
   * @param control - Submitted control. An `InGroup` instance typically.
   * @param element - HTML form element control.
   */
  constructor(control: InControl<TModel>, element: InFormElement<TElt>) {
    super(control);
    this[Form$element__symbol] = element;
  }

  /**
   * Form element control.
   *
   * Unlike {@link input input control} this one is not supposed to be submitted. But it contains a `<form>` element
   * issuing a `submit` event.
   */
  get element(): InFormElement<TElt> {
    return this[Form$element__symbol];
  }

}

export namespace Form {

  export type ModelType<TForm extends Form<any, any>> = Field.ValueType<TForm>;

  export type ElementType<TForm extends Form<any, any>> = TForm extends Form<any, infer TElt> ? TElt : never;

}
