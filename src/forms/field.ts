import { InControl } from '@frontmeans/input-aspects';
import { ShareableByComponent } from '../share';
import { FormUnit } from './form-unit';

/**
 * A field of the user input {@link Form form}.
 *
 * A component {@link FieldShare shares} field (e.g. using {@link SharedField @SharedField} decorator) to make it
 * accessible by component itself and nested ones. E.g. to add it to {@link Form form} or to manipulate its value.
 *
 * The field instance is not usable until it is {@link shareBy bound} to its sharer component. The latter is done
 * automatically when the field is shared by {@link FieldShare}.
 *
 * @typeParam TValue - Field value type.
 * @typeParam TSharer - Field sharer component type.
 */
export class Field<TValue, TSharer extends object = any>
    extends FormUnit<Field<TValue>, TValue, TSharer, Field.Controls<TValue>>
    implements Field.Controls<TValue> {

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
   */
  export interface Controls<TModel> extends FormUnit.Controls<TModel> {

    /**
     * Field input control.
     */
    readonly control: InControl<TModel>;

  }

  /**
   * Form field controls provider signature.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export type Provider<TValue, TSharer extends object = any> =
      ShareableByComponent.Provider<TSharer, Controls<TValue>>;

}
