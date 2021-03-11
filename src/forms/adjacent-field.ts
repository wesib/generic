import { InBuilder, InControl } from '@frontmeans/input-aspects';
import { AfterEvent, afterThe, afterValue, digAfter } from '@proc7ts/fun-events';
import { valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { shareLocator, ShareLocator } from '../shares';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormUnit } from './form-unit';
import { FormShare } from './form.share';

/**
 * A field adjacent to another form unit.
 *
 * Suitable e.g. for buttons or error indicators.
 *
 * The controls of adjacent field are based on the ones of the unit it is adjacent to.
 *
 * @typeParam TValue - Adjacent field value type.
 * @typeParam TAdjacentTo - A type of form unit the field is adjacent to.
 * @typeParam TAdjusted - A type of controls to adjust. I.e. the ones of the form unit the field is adjacent to.
 * @typeParam TSharer - Adjacent field sharer component type.
 */
export class AdjacentField<
    TValue,
    TAdjacentTo extends FormUnit<unknown, TAdjusted>,
    TAdjusted extends FormUnit.Controls<unknown> = FormUnit.ControlsType<TAdjacentTo>,
    TSharer extends object = any,
    > extends Field<TValue, TSharer> {

  /**
   * Creates a field adjacent to another one.
   *
   * @param controls - Either a field controls instance, or its provider.
   * @param adjacentTo - A locator of the field share the created field is adjacent to. Includes local shares by
   * default. Defaults to {@link FieldShare}.
   */
  static toField<TValue, TSharer extends object = any>(
      controls:
          | Field.Controls<TValue>
          | AdjacentField.Provider<TValue, Field<unknown>, Field.Controls<unknown>, TSharer>,
      adjacentTo: ShareLocator.Mandatory<Field<unknown>> = FieldShare,
  ): AdjacentField.ToField<TValue, TSharer> {
    return new this(controls, adjacentTo);
  }

  /**
   * Creates a field adjacent to form.
   *
   * @param controls - Either a field controls instance, or its provider.
   * @param adjacentTo - A locator of the form share the created field is adjacent to. Includes local shares by default.
   * Defaults to {@link FormShare}.
   */
  static toForm<TValue, TSharer extends object = any>(
      controls:
          | Field.Controls<TValue>
          | AdjacentField.Provider<TValue, Form<unknown>, Form.Controls<unknown>, TSharer>,
      adjacentTo: ShareLocator.Mandatory<Form<unknown>> = FormShare,
  ): AdjacentField.ToForm<TValue, TSharer> {
    return new this(controls, adjacentTo);
  }

  /**
   * Constructs adjacent field.
   *
   * @param controls - Either a field controls instance, or its provider.
   * @param adjacentTo - A locator of the share the field is adjacent to. Includes local shares by default.
   */
  constructor(
      controls: Field.Controls<TValue> | AdjacentField.Provider<TValue, TAdjacentTo, TAdjusted, TSharer>,
      adjacentTo: ShareLocator.Mandatory<TAdjacentTo>,
  ) {
    super(AdjacentField$provider(
        () => this,
        valueRecipe(controls),
        shareLocator(adjacentTo, { local: 'too' }),
    ));
  }

}

export namespace AdjacentField {

  /**
   * A field adjacent to another field.
   *
   * @typeParam TValue - Adjacent field value type.
   * @typeParam TSharer - Adjacent field sharer component type.
   */
  export type ToField<TValue, TSharer extends object = any> = AdjacentField<
      TValue,
      Field<unknown>,
      Field.Controls<unknown>,
      TSharer>;

  /**
   * A field adjacent to form.
   *
   * @typeParam TValue - Adjacent field value type.
   * @typeParam TSharer - Adjacent field sharer component type.
   */
  export type ToForm<TValue, TSharer extends object = any> = AdjacentField<
      TValue,
      Form<unknown>,
      Form.Controls<unknown>,
      TSharer>;

  /**
   * Adjacent field builder.
   *
   * @typeParam TValue - Adjacent field value type.
   * @typeParam TAdjacentTo - A type of form unit the field is adjacent to.
   * @typeParam TAdjusted - A type of controls to adjust. I.e. the ones of the form unit the field is adjacent to.
   * @typeParam TSharer - Adjacent field sharer component type.
   */
  export interface Builder<
      TValue,
      TAdjacentTo extends FormUnit<unknown, TAdjusted>,
      TAdjusted extends FormUnit.Controls<unknown> = FormUnit.ControlsType<TAdjacentTo>,
      TSharer extends object = any,
      > extends Field.Builder<TValue, TSharer> {

    /**
     * Sharer component context.
     */
    readonly sharer: ComponentContext<TSharer>;

    /**
     * Target field.
     */
    readonly field: AdjacentField<TValue, TAdjacentTo, TAdjusted, TSharer>;

    /**
     * Field input control builder.
     */
    readonly control: InBuilder<InControl<TValue>, TValue>;

    /**
     * Form unit the field is adjacent to.
     */
    readonly adjacentTo: TAdjacentTo;

    /**
     * Adjusted form unit control.
     */
    readonly adjusted: TAdjusted;

  }

  /**
   * Adjacent field controls provider signature.
   *
   * @typeParam TValue - Adjacent field value type.
   * @typeParam TAdjacentTo - A type of form unit the field is adjacent to.
   * @typeParam TAdjusted - A type of controls to adjust. I.e. the ones of the form unit the field is adjacent to.
   * @typeParam TSharer - Adjacent field sharer component type.
   */
  export type Provider<
      TValue,
      TAdjacentTo extends FormUnit<unknown, TAdjusted>,
      TAdjusted extends FormUnit.Controls<unknown> = FormUnit.ControlsType<TAdjacentTo>,
      TSharer extends object = any,
      > =
  /**
   * @param builder - Adjacent field builder.
   *
   * @returns Either field controls instance, or an `AfterEvent` keeper reporting one.
   */
      (
          this: void,
          builder: Builder<TValue, TAdjacentTo, TAdjusted, TSharer>,
      ) => Field.Controls<TValue> | AfterEvent<[Field.Controls<TValue>?]>;

}

function AdjacentField$provider<
    TValue,
    TAdjacentTo extends FormUnit<unknown, TAdjusted>,
    TAdjusted extends FormUnit.Controls<unknown> = FormUnit.ControlsType<TAdjacentTo>,
    TSharer extends object = any>(
    field: () => AdjacentField<TValue, TAdjacentTo, TAdjusted, TSharer>,
    provider: AdjacentField.Provider<TValue, TAdjacentTo, TAdjusted, TSharer>,
    adjacentLocator: ShareLocator.Fn<TAdjacentTo>,
): Field.Provider<TValue, TSharer> {
  return builder => adjacentLocator(builder.sharer).do(
      digAfter((adjacentTo?: TAdjacentTo, _sharer?): AfterEvent<[Field.Controls<TValue>?]> => adjacentTo
          ? adjacentTo.readControls.do(
              digAfter((adjusted?: TAdjusted): AfterEvent<[Field.Controls<TValue>?]> => adjusted
                  ? afterValue(provider({
                    ...builder,
                    field: field(),
                    adjacentTo,
                    adjusted,
                  }))
                  : afterThe()),
          )
          : afterThe()),
  );
}
