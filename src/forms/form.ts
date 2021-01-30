import { InControl, InFormElement } from '@frontmeans/input-aspects';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { FormShare } from './form.share';

export function Form<TModel = any, TElt extends HTMLElement = HTMLElement, TClass extends ComponentClass = Class>(
    def: FormDef<TModel, TElt> = {},
): ComponentShareDecorator<Form<TModel, TElt>, TClass> {

  const { share = FormShare } = def;

  return Shared(share);
}

/**
 * User input form.
 */
export interface Form<TModel = any, TElt extends HTMLElement = HTMLElement> {

  /**
   * Form input control.
   */
  readonly control: InControl<TModel>;

  /**
   * Form element control.
   *
   * Unlike {@link input input control} this one is not supposed to be submitted. But it contains a `<form>` element
   * issuing a `submit` event.
   */
  readonly element: InFormElement<TElt>;

}

export interface FormDef<TModel = any, TElt extends HTMLElement = HTMLElement> {

  readonly share?: ComponentShareRef<Form<TModel, TElt>>;

}
