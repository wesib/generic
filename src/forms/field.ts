import { InControl } from '@frontmeans/input-aspects';
import { noop, valueProvider, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';

const Field$control__symbol = (/*#__PURE__*/ Symbol('Field.control'));

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
export class Field<TValue, TSharer extends object = any> {

  /**
   * @internal
   */
  private [Field$control__symbol]: Field$Control<TValue, TSharer>;

  /**
   * Constructs a form field.
   *
   * @param control - Either input control instance, or its provider.
   */
  constructor(control: InControl<TValue> | Field.Provider<TValue, TSharer>) {
    this[Field$control__symbol] = new Field$Control(this, control);
  }

  /**
   * Field input control.
   */
  get control(): InControl<TValue> {
    return this[Field$control__symbol].get();
  }

  /**
   * Binds this field to its sharer.
   *
   * @param sharer - Sharer component context.
   *
   * @returns `this` instance.
   */
  shareBy(sharer: ComponentContext<TSharer>): this {
    this[Field$control__symbol].bind(sharer);
    return this;
  }

}

class Field$Control<TValue, TSharer extends object> {

  private readonly _get: Field.Provider<TValue>;

  constructor(
      private readonly _field: Field<TValue, TSharer>,
      control: InControl<TValue> | Field.Provider<TValue, TSharer>,
  ) {
    this._get = valueRecipe<InControl<TValue>, [ComponentContext]>(control);
  }

  get(): InControl<TValue> {
    throw new TypeError(`Field ${String(this._field)} is not properly shared yet`);
  }

  bind(sharerContext: ComponentContext<TSharer>): void {
    this.bind = noop;
    this.get = () => {

      const control = this._get(sharerContext);

      this.get = valueProvider(control);

      return control;
    };
  }

}

export namespace Field {

  /**
   * Value type of the form field.
   *
   * @typeParam TField - Field type.
   */
  export type ValueType<TField extends Field<any>> = TField extends Field<infer TValue> ? TValue : never;

  /**
   * Input control provider for form field.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Supported field sharer component type.
   */
  export type Provider<TValue, TSharer extends object = any> =
  /**
   * @typeParam TComponent - Actual field sharer component type.
   * @param sharer - Sharer component context.
   *
   * @returns Input control instance.
   */
      <TComponent extends TSharer>(
          this: void,
          sharer: ComponentContext<TComponent>,
      ) => InControl<TValue>;

}
