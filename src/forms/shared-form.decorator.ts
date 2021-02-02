import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { Form } from './form';
import { FormShare } from './form.share';

export function SharedForm<TModel = any, TElt extends HTMLElement = HTMLElement, TClass extends ComponentClass = Class>(
    def: SharedFormDef<TModel, TElt> = {},
    ...define: SharedForm.Definer<TModel, TElt, TClass>[]
): ComponentShareDecorator<Form<TModel, TElt>, TClass> {

  const { share = FormShare } = def;

  return Shared(share, ...define);
}

export interface SharedFormDef<TModel = any, TElt extends HTMLElement = HTMLElement> {

  readonly share?: ComponentShareRef<Form<TModel, TElt>>;

}

export namespace SharedForm {

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
