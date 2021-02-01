import { InControl, InFormElement } from '@frontmeans/input-aspects';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { FormShare } from './form.share';

export function Form<TModel = any, TElt extends HTMLElement = HTMLElement, TClass extends ComponentClass = Class>(
    def: FormDef<TModel, TElt> = {},
    ...define: Form.Definer<TModel, TElt, TClass>[]
): ComponentShareDecorator<Form<TModel, TElt>, TClass> {

  const { share = FormShare } = def;

  return Shared(share, ...define);
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

export namespace Form {

  export interface Descriptor<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class>
      extends Shared.Descriptor<Form<TModel, TElt>, TClass> {

    readonly share: FormShare<TModel, TElt>;

  }

  export type Definer<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class> =
      (
          this: void,
          descriptor: Descriptor<TModel, TElt, TClass>,
      ) => Definition<TModel, TElt, TClass>;

  export type Definition<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class> =
      Shared.Definition<Form<TModel, TElt>, TClass>;

}
