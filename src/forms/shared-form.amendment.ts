import { AeClass, Amendment, isAmendatory, MemberAmendment } from '@proc7ts/amend';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { Share, Shared, SharedAmendment, SharedDef, ShareRef, TargetShare } from '../shares';
import { Form } from './form';
import { FormShare } from './form.share';
import { AeSharedFormUnit } from './shared-form-unit.amendment';

/**
 * An amended entity representing a component member containing a shared from to amend.
 *
 * @typeParam TForm - Form type.
 * @typeParam TMemberValue - Amended member value type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - Amended component class type.
 */
export interface AeSharedForm<
    TForm extends Form<TModel, TElt>,
    TMemberValue extends SharedDef.Value<TForm> = SharedDef.Value<TForm>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>
    extends AeSharedFormUnit<TForm, TMemberValue, TModel, Form.Controls<TModel>, TClass> {

  /**
   * Target form share instance.
   */
  readonly share: Share<TForm>;

}

/**
 * An amendment of component member containing a shared form.
 *
 * Created by {@link SharedForm} function.
 *
 * @typeParam TForm - Form type.
 * @typeParam TMemberValue - Amended member value type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended form entity type.
 */
export type SharedFormAmendment<
    TForm extends Form<TModel, TElt>,
    TMemberValue extends SharedDef.Value<TForm> = SharedDef.Value<TForm>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class,
    TAmended extends AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass> =
        AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass>> =
    MemberAmendment.ForBase<
        AeClass<TClass>,
        AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass>,
        TMemberValue,
        TClass,
        TMemberValue,
        TAmended>;

/**
 * Creates an amendment (and decorator) of component member that {@link FormShare shares} a form.
 *
 * @typeParam TForm - Form type.
 * @typeParam TMemberValue - Amended member value type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended form entity type.
 * @param def - Form definition.
 * @param amendments - Amendments to apply.
 *
 * @returns New form member amendment.
 */
export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TMemberValue extends SharedDef.Value<TForm> = SharedDef.Value<TForm>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class,
    TAmended extends AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass> =
        AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass>>(
    def?: SharedFormDef<TForm, TModel, TElt>,
    ...amendments: Amendment<TAmended>[]
): SharedFormAmendment<TForm, TMemberValue, TModel, TElt, TClass>;

/**
 * Creates an amendment (and decorator) of component member that {@link FormShare shares} a form as default share.
 *
 *@typeParam TForm - Form type.
 * @typeParam TMemberValue - Amended member value type.
 * @typeParam TModel - Form model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended form entity type.
 * @param amendments - Amendments to apply.
 *
 * @returns New form member amendment.
 */
export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TMemberValue extends SharedDef.Value<TForm> = SharedDef.Value<TForm>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class,
    TAmended extends AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass> =
        AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass>>(
    ...amendments: Amendment<TAmended>[]
): SharedFormAmendment<TForm, TMemberValue, TModel, TElt, TClass>;

export function SharedForm<
    TForm extends Form<TModel, TElt>,
    TMemberValue extends SharedDef.Value<TForm> = SharedDef.Value<TForm>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class,
    TAmended extends AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass> =
        AeSharedForm<TForm, TMemberValue, TModel, TElt, TClass>>(
    defOrAmendment:
        | SharedFormDef<TForm, TModel, TElt>
        | Amendment<TAmended> = {},
    ...amendments: Amendment<TAmended>[]
): SharedAmendment<TForm, TMemberValue, TClass, TAmended> {
  if (typeof defOrAmendment === 'function' || isAmendatory(defOrAmendment)) {
    return Shared<TForm, TMemberValue, TClass, TAmended>(
        FormShare as ShareRef<any> as ShareRef<TForm>,
        defOrAmendment,
        ...amendments,
    );
  }

  const { share = FormShare as ShareRef<any> as ShareRef<TForm> } = defOrAmendment;

  return Shared(share, ...amendments);
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
