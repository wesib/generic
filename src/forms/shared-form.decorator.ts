import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare, ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Builds a decorator of component property that {@link FormShare shares} a form.
 *
 * @typeParam TForm - Form type.
 * @param def - Form definition.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<TForm extends Form<any, any>, TClass extends ComponentClass = Class>(
    def?: SharedFormDef<Form.ModelType<TForm>, Form.ElementType<TForm>>,
    ...define: SharedForm.Definer<TForm, TClass>[]
): ComponentShareDecorator<TForm, TClass>;

/**
 * Builds a decorator of component property that {@link FormShare shares} a form as default share.
 *
 * @typeParam TForm - Form type.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<TForm extends Form<any, any>, TClass extends ComponentClass = Class>(
    ...define: SharedForm.Definer<TForm, TClass>[]
): ComponentShareDecorator<TForm, TClass>;

export function SharedForm<TForm extends Form<any, any>, TClass extends ComponentClass>(
    defOrDefiner:
        | SharedFormDef<Form.ModelType<TForm>, Form.ElementType<TForm>>
        | SharedForm.Definer<TForm, TClass> = {},
    ...define: SharedForm.Definer<TForm, TClass>[]
): ComponentShareDecorator<TForm, TClass> {
  if (typeof defOrDefiner === 'function') {
    return Shared(FormShare, defOrDefiner, ...define);
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
   * @typeParam TClass - A type of decorated component class.
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
   * @typeParam TForm - Form type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<TForm extends Form<any, any>, TClass extends ComponentClass = Class> =
  /**
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component property definition, or nothing if the property definition is not to be changed.
   */
      (
          this: void,
          descriptor: Descriptor<Form.ModelType<TForm>, Form.ElementType<TForm>, TClass>,
      ) => Definition<TForm, TClass> | void;

  /**
   * A definition of component property that {@link FormShare shares} a form.
   *
   * @typeParam TForm - Form type.
   */
  export type Definition<TForm extends Form<any, any>, TClass extends ComponentClass = Class> =
      Shared.Definition<TForm, TClass>;

}
