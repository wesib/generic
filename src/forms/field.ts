import { InControl } from '@frontmeans/input-aspects';

const Field$control__symbol = (/*#__PURE__*/ Symbol('Field.control'));

/**
 * A field of the user input {@link Form form}.
 *
 * A component {@link FieldShare shares} field (e.g. using {@link SharedField @SharedField} decorator) to make it
 * accessible by component itself and nested ones. E.g. to add it to {@link Form form} or to manipulate its value.
 *
 * @typeParam TValue - Field value type.
 */
export class Field<TValue> {

  /**
   * @internal
   */
  private readonly [Field$control__symbol]: InControl<TValue>;

  /**
   * Constructs a form field.
   *
   * @param control - Field input control.
   */
  constructor(control: InControl<TValue>) {
    this[Field$control__symbol] = control;
  }

  /**
   * Field input control.
   */
  get control(): InControl<TValue> {
    return this[Field$control__symbol];
  }

}

export namespace Field {

  export type ValueType<TField extends Field<any>> = TField extends Field<infer TValue> ? TValue : never;

}
