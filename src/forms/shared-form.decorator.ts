import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare, ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Builds a decorator of component property that {@link FormShare shares} a form.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 * @param def - Form definition.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<
    TModel = any,
    TElt extends HTMLElement = HTMLElement,
    TClass extends ComponentClass = Class>(
    def?: SharedFormDef<TModel, TElt>,
    ...define: SharedForm.Definer<TModel, TElt, TClass>[]
): ComponentShareDecorator<Form<TModel, TElt>, TClass>;

/**
 * Builds a decorator of component property that {@link FormShare shares} a form as default share.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<
    TModel = any,
    TElt extends HTMLElement = HTMLElement,
    TClass extends ComponentClass = Class>(
    ...define: SharedForm.Definer<TModel, TElt, TClass>[]
): ComponentShareDecorator<Form<TModel, TElt>, TClass>;

export function SharedForm<
    TModel = any,
    TElt extends HTMLElement = HTMLElement,
    TClass extends ComponentClass = Class>(
    defOrDefiner: SharedFormDef<TModel, TElt> | SharedForm.Definer<TModel, TElt, TClass> = {},
    ...define: SharedForm.Definer<TModel, TElt, TClass>[]
): ComponentShareDecorator<Form<TModel, TElt>, TClass> {
  if (typeof defOrDefiner === 'function') {
    return Shared(FormShare, ...define);
  }

  const { share = FormShare } = defOrDefiner;

  return Shared(share, ...define);
}

/**
 * Shared form definition.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 */
export interface SharedFormDef<TModel = any, TElt extends HTMLElement = HTMLElement> {

  /**
   * A reference to the target form share.
   */
  readonly share?: ComponentShareRef<Form<TModel, TElt>>;

}

export namespace SharedForm {

  /**
   * A descriptor of the component property that {@link FormShare shares} a form.
   *
   * Passed to {@link Definer property definer} by {@link SharedForm @SharedForm} decorator to build a
   * {@link Definition property definition}.
   *
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Descriptor<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class>
      extends Shared.Descriptor<Form<TModel, TElt>, TClass> {

    /**
     * Target form share instance.
     */
    readonly share: ComponentShare<Form<TModel, TElt>>;

  }

  /**
   * A signature of definition builder of the component property that {@link FormShare shares} a form.
   *
   * This is a function called by {@link SharedForm @SharedForm} decorator to apply additional definitions.
   *
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class> =
      (
          this: void,
          descriptor: Descriptor<TModel, TElt, TClass>,
      ) => Definition<TModel, TElt, TClass>;

  /**
   * A definition of component property that {@link FormShare shares} a form.
   *
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   */
  export type Definition<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TClass extends ComponentClass = Class> =
      Shared.Definition<Form<TModel, TElt>, TClass>;

}
