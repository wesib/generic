import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { Share, ShareDecorator, ShareRef, TargetShare } from '../shares';
import { Form } from './form';
import { FormShare } from './form.share';
import { SharedFormUnit } from './shared-form-unit.decorator';

/**
 * Builds a decorator of component property that {@link FormShare shares} a form.
 *
 * @typeParam TForm - Form type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Form definition.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>(
    def?: SharedFormDef<TForm, TModel, TElt>,
    ...define: SharedForm.Definer<TForm, TModel, TElt, TClass>[]
): ShareDecorator<TForm, TClass>;

/**
 * Builds a decorator of component property that {@link FormShare shares} a form as default share.
 *
 * @typeParam TForm - Form type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - A type of decorated component class.
 * @param define - Form property definition builders.
 *
 * @returns Component property decorator.
 */
export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>(
    ...define: SharedForm.Definer<TForm, TModel, TElt, TClass>[]
): ShareDecorator<TForm, TClass>;

export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>(
    defOrDefiner:
        | SharedFormDef<TForm, TModel, TElt>
        | SharedForm.Definer<TForm, TModel, TElt, TClass> = {},
    ...define: SharedForm.Definer<TForm, TModel, TElt, TClass>[]
): ShareDecorator<TForm, TClass> {
  if (typeof defOrDefiner === 'function') {
    return SharedFormUnit<TForm, TModel, Form.Body<TModel, TElt>, TClass>(
        FormShare as ShareRef<any> as ShareRef<TForm>,
        defOrDefiner,
        ...define,
    );
  }

  const { share = FormShare as ShareRef<any> as ShareRef<TForm> } = defOrDefiner;

  return SharedFormUnit<TForm, TModel, Form.Body<TModel, TElt>, TClass>(share, ...define);
}

/**
 * Shared form definition.
 *
 * @typeParam TForm - Form type.
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 */
export interface SharedFormDef<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>> {

  /**
   * Target form share.
   */
  readonly share?: TargetShare<TForm>;

}

export namespace SharedForm {

  /**
   * A descriptor of the component property that {@link FormShare shares} a form.
   *
   * Passed to {@link Definer property definer} by {@link SharedForm @SharedForm} decorator to build a
   * {@link Definition property definition}.
   *
   * @typeParam TForm - Form type.
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TClass - A type of decorated component class.
   */
  export interface Descriptor<
      TForm extends Form<TModel, TElt>,
      TModel = Form.ModelType<TForm>,
      TElt extends HTMLElement = Form.ElementType<TForm>,
      TClass extends ComponentClass = Class>
      extends SharedFormUnit.Descriptor<TForm, TModel, Form.Body<TModel, TElt>, TClass> {

    /**
     * Target form share instance.
     */
    readonly share: Share<TForm>;

  }

  /**
   * A signature of definition builder of the component property that {@link FormShare shares} a form.
   *
   * This is a function called by {@link SharedForm @SharedForm} decorator to apply additional definitions.
   *
   * @typeParam TForm - Form type.
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<
      TForm extends Form<TModel, TElt>,
      TModel = Form.ModelType<TForm>,
      TElt extends HTMLElement = Form.ElementType<TForm>,
      TClass extends ComponentClass = Class> =
  /**
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component property definition, or nothing if the property definition is not to be changed.
   */
      (
          this: void,
          descriptor: Descriptor<TForm, TModel, TElt, TClass>,
      ) => Definition<TForm, TModel, TElt, TClass> | void;

  /**
   * A definition of component property that {@link FormShare shares} a form.
   *
   * @typeParam TForm - Form type.
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definition<
      TForm extends Form<TModel, TElt>,
      TModel = Form.ModelType<TForm>,
      TElt extends HTMLElement = Form.ElementType<TForm>,
      TClass extends ComponentClass = Class> =
      SharedFormUnit.Definition<TForm, TModel, Form.Body<TModel, TElt>, TClass>;

}
