import { InControl, InFormElement } from '@frontmeans/input-aspects';
import { Field } from './field';

/**
 * User input form.
 */
export class Form<TModel = any, TElt extends HTMLElement = HTMLElement> extends Field<TModel> {

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
