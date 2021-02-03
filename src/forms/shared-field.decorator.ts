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
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field definition.
 * @param define - Field property definition builders.
 *
 * @return Component property decorator.
 */
export function SharedField<TValue = any, TClass extends ComponentClass = Class>(
    def?: SharedFieldDef<TValue>,
    ...define: SharedField.Definer<TValue, TClass>[]
): ComponentShareDecorator<Field<TValue>, TClass>;

/**
 * Builds a decorator of component property that {@link FieldShare shares} a form field and adds it to the
 * {@link FormShare default form} under decorated property name.
 *
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param define - Field property definition builders.
 *
 * @return Component property decorator.
 */
export function SharedField<TValue = any, TClass extends ComponentClass = Class>(
    ...define: SharedField.Definer<TValue, TClass>[]
): ComponentShareDecorator<Field<TValue>, TClass>;

export function SharedField<TValue = any, TClass extends ComponentClass = Class>(
    defOrDefiner: SharedFieldDef<TValue> | SharedField.Definer<TValue, TClass> = {},
    ...define: SharedField.Definer<TValue, TClass>[]
): ComponentShareDecorator<Field<TValue>, TClass> {

  let def: SharedFieldDef<TValue>;
  let fieldName: string | undefined;
  let definers: SharedField.Definer<TValue, TClass>[];

  if (typeof defOrDefiner === 'function') {
    def = {};
    definers = [FieldName(), defOrDefiner, ...define];
  } else {
    def = defOrDefiner;
    fieldName = defOrDefiner.name;
    definers = [FieldName({ name: fieldName }), ...define];
  }

  const { share = FieldShare, formShare: formShareRef = FormShare } = def;
  const formShare: ComponentShare<Form<any, any>> = formShareRef[ComponentShare__symbol];

  return Shared(
      share,
      ...definers.map(definer => (
          descriptor: Shared.Descriptor<Field<TValue>, TClass>,
      ) => definer({ ...descriptor, formShare, name: Field$name(descriptor.key, fieldName) })),
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
   * A reference to the share of the form to add the field to.
   *
   * The {@link FieldShare default form share} is used when omitted.
   */
  readonly formShare?: ComponentShareRef<Form>;

  /**
   * Field name.
   *
   * The shared field will be added to the input control group (`InGroup`) withing the {@link formShare target form},
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
     * A share of the form to add the field to.
     */
    readonly formShare: ComponentShare<Form<any, any>>;

    /**
     * Field name, or `null` when the field is not to be added to the {@link formShare form}.
     */
    readonly name: string | null;

  }

  /**
   * A signature of definition builder of the component property that {@link FieldShare shares} a form field.
   *
   * This is a function called by {@link SharedField @SharedField} decorator to apply additional definitions.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<TValue = any, TClass extends ComponentClass = Class> =
      (
          this: void,
          descriptor: Descriptor<TValue, TClass>,
      ) => Definition<TValue, TClass> | void;

  /**
   * A definition of component property that {@link FieldShare shares} a form field.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TClass - A type of component class.
   */
  export type Definition<TValue = any, TClass extends ComponentClass = Class> =
      Shared.Definition<Field<TValue>, TClass>;

}
