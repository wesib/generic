import { InControl } from '@frontmeans/input-aspects';
import { digAfter } from '@proc7ts/fun-events';
import { ComponentShareable } from '../share';
import { FormDefaults } from './form-defaults';
import { FormUnit } from './form-unit';

/**
 * A field of the user input {@link Form form}.
 *
 * A component {@link FieldShare shares} field (e.g. using {@link SharedField @SharedField} decorator) to make it
 * accessible by component itself and nested ones. E.g. to add it to {@link Form form} or to manipulate its value.
 *
 * The field instance is not usable until it is bound to its sharer component. The latter is done automatically when
 * the field is shared by {@link FieldShare}.
 *
 * @typeParam TValue - Field value type.
 * @typeParam TSharer - Field sharer component type.
 */
export class Field<TValue, TSharer extends object = any>
    extends FormUnit<TValue, Field.Controls<TValue>, TSharer>
    implements Field.Controls<TValue> {

  constructor(controls: Field.Controls<TValue> | Field.Provider<TValue, TSharer>) {
    super(Field$provider(() => this, controls));
  }

  toString(): string {
    return 'Field';
  }

}

export namespace Field {

  /**
   * A value type of the given form field.
   *
   * @typeParam TField - Field type.
   */
  export type ValueType<TField extends Field<any>> = FormUnit.ValueType<TField>;

  /**
   * Form field controls.
   *
   * @typeParam TValue - Input value type.
   */
  export interface Controls<TValue> extends FormUnit.Controls<TValue> {

    /**
     * Field input control.
     */
    readonly control: InControl<TValue>;

  }

  /**
   * Form field controls provider signature.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export type Provider<TValue, TSharer extends object = any> =
      ComponentShareable.Provider<Controls<TValue>, TSharer>;

}

function Field$provider<TValue, TSharer extends object>(
    field: () => Field<TValue, TSharer>,
    controls: Field.Controls<TValue> | Field.Provider<TValue, TSharer>,
): Field.Provider<TValue, TSharer> {

  const provider = ComponentShareable.provider(controls);

  return sharer => sharer.get(FormDefaults).rules.do(
      digAfter(defaults => defaults.setupField(field(), provider(sharer))),
  );
}
