import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol, ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { Field } from './field';
import { FieldName } from './field-name.definer';
import { Field$name } from './field.impl';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Builds a decorator of component property that {@link FieldShare shares} a form field.
 *
 * @typeParam TField - Field type.
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field definition.
 * @param define - Field property definition builders.
 *
 * @return Component property decorator.
 */
export function SharedField<
    TField extends Field<TValue>,
    TValue = TField extends Field<infer T> ? T : never,
    TClass extends ComponentClass = Class>(
    def?: SharedFieldDef<TValue>,
    ...define: SharedField.Definer<TField, TValue, TClass>[]
): ComponentShareDecorator<TField, TClass>;

/**
 * Builds a decorator of component property that {@link FieldShare shares} a form field and adds it to the
 * {@link FormShare default form} under decorated property name.
 *
 * @typeParam TField - Field type.
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param define - Field property definition builders.
 *
 * @return Component property decorator.
 */
export function SharedField<
    TField extends Field<TValue>,
    TValue = TField extends Field<infer T> ? T : never,
    TClass extends ComponentClass = Class>(
    ...define: SharedField.Definer<TField, TValue, TClass>[]
): ComponentShareDecorator<TField, TClass>;

export function SharedField<
    TField extends Field<TValue>,
    TValue,
    TClass extends ComponentClass>(
    defOrDefiner: SharedFieldDef<TValue> | SharedField.Definer<TField, TValue, TClass> = {},
    ...define: SharedField.Definer<TField, TValue, TClass>[]
): ComponentShareDecorator<TField, TClass> {

  let def: SharedFieldDef<TValue>;
  let fieldName: string | undefined;
  let definers: SharedField.Definer<TField, TValue, TClass>[];

  if (typeof defOrDefiner === 'function') {
    def = {};
    definers = [FieldName(), defOrDefiner, ...define];
  } else {
    def = defOrDefiner;
    fieldName = defOrDefiner.name;
    definers = [FieldName({ name: fieldName }), ...define];
  }

  const { share = FieldShare, form: formShareRef = FormShare } = def;
  const formShare: ComponentShare<Form<any, any>> = formShareRef[ComponentShare__symbol];

  return Shared(
      share,
      ...definers.map(definer => (
          descriptor: Shared.Descriptor<Field<TValue>, TClass>,
      ) => definer({
        ...descriptor,
        formShare,
        name: Field$name(descriptor.key, fieldName),
      })),
  );
}

/**
 * Shared form field definition.
 *
 * @typeParam TValue - Field value type.
 */
export interface SharedFieldDef<TValue = any> {

  /**
   * A reference to the target field share.
   */
  readonly share?: ComponentShareRef<Field<TValue>>;

  /**
   * A form to add the field to.
   *
   * This is a reference to the form share.
   *
   * The {@link FieldShare default form share} is used when omitted.
   */
  readonly form?: ComponentShareRef<Form>;

  /**
   * Field name.
   *
   * The shared field will be added to the input control group (`InGroup`) within the {@link form target form},
   * unless the name is empty string.
   *
   * Equals to decorated property name when omitted.
   */
  readonly name?: string;

}

export namespace SharedField {

  /**
   * A descriptor of the component property that {@link FieldShare shares} a form field.
   *
   * Passed to {@link Definer property definer} by {@link SharedField @SharedField} decorator to build a
   * {@link Definition property definition}.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TClass - A type of component class.
   */
  export interface Descriptor<TValue = any, TClass extends ComponentClass = Class>
      extends Shared.Descriptor<Field<TValue>, TClass> {

    /**
     * Target field share instance.
     */
    readonly share: ComponentShare<Field<TValue>>;

    /**
     * Predefined share of the form to add the field to, or `undefined` when unknown.
     */
    readonly formShare?: ComponentShare<Form<any, any>>;

    /**
     * Predefined field name, or `null`/`undefined` when the field is not to be added to the {@link formShare form}.
     */
    readonly name?: string | null;

  }

  /**
   * A signature of definition builder of the component property that {@link FieldShare shares} a form field.
   *
   * This is a function called by {@link SharedField @SharedField} decorator to apply additional definitions.
   *
   * @typeParam TField - Field type.
   * @typeParam TValue - Field value type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<
      TField extends Field<TValue>,
      TValue = TField extends Field<infer T> ? T : never,
      TClass extends ComponentClass = Class> =
  /**
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component property definition, or nothing if the property definition is not to be changed.
   */
      (
          this: void,
          descriptor: Descriptor<TValue, TClass>,
      ) => Definition<TField, TValue, TClass> | void;

  /**
   * A definition of component property that {@link FieldShare shares} a form field.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TClass - A type of component class.
   */
  export type Definition<
      TField extends Field<TValue>,
      TValue = TField extends Field<infer T> ? T : never,
      TClass extends ComponentClass = Class> =
      Shared.Definition<TField, TClass>;

}
