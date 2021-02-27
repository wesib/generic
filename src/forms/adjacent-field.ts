import { InBuilder, InControl } from '@frontmeans/input-aspects';
import { AfterEvent, afterThe, digAfter, isAfterEvent } from '@proc7ts/fun-events';
import { valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { shareLocator, ShareLocator } from '../shares';
import { Field } from './field';
import { FormUnit } from './form-unit';

export class AdjacentField<TValue, TSharer extends object = any> extends Field<TValue, TSharer> {

  constructor(
      controls: Field.Controls<TValue> | AdjacentField.Provider<TValue, TSharer>,
      adjacentTo: ShareLocator.Mandatory<FormUnit<unknown>>,
  ) {
    super(AdjacentField$provider(() => this, valueRecipe(controls), shareLocator(adjacentTo)));
  }

  get isAdjacent(): true {
    return true;
  }

}

export namespace AdjacentField {

  /**
   * Form field builder.
   *
   * @typeParam TValue - Input value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export interface Builder<TValue, TSharer extends object> extends Field.Builder<TValue, TSharer> {

    /**
     * Sharer component context.
     */
    readonly sharer: ComponentContext<TSharer>;

    /**
     * Target field.
     */
    readonly field: AdjacentField<TValue, TSharer>;

    /**
     * Field input control builder.
     */
    readonly control: InBuilder<InControl<TValue>, TValue>;

    /**
     * Form unit the field is adjacent to.
     */
    readonly adjacentTo: FormUnit<unknown>;

    /**
     * Adjusted form unit control.
     */
    readonly adjusted: InControl<unknown>;

  }

  /**
   * Adjacent form field controls provider signature.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export type Provider<TValue, TSharer extends object = any> =
  /**
   * @param builder - Adjacent field builder.
   *
   * @returns Either field controls instance, or an `AfterEvent` keeper reporting one.
   */
      (
          this: void,
          builder: Builder<TValue, TSharer>,
      ) => Field.Controls<TValue> | AfterEvent<[Field.Controls<TValue>?]>;

}

function AdjacentField$provider<TValue, TSharer extends object>(
    field: () => AdjacentField<TValue, TSharer>,
    provider: AdjacentField.Provider<TValue>,
    adjacentLocator: ShareLocator.Fn<FormUnit<unknown>>,
): Field.Provider<TValue, TSharer> {
  return builder => adjacentLocator(builder.sharer).do(
      digAfter((adjacentTo?: FormUnit<unknown>, _sharer?): AfterEvent<[Field.Controls<TValue>?]> => adjacentTo
          ? adjacentTo.readControls.do(
              digAfter((adjusted?: FormUnit.Controls<unknown>): AfterEvent<[Field.Controls<TValue>?]> => {
                if (!adjusted) {
                  return afterThe();
                }

                const adjacentBuilder: AdjacentField.Builder<TValue, TSharer> = {
                  ...builder,
                  field: field(),
                  adjacentTo,
                  adjusted: adjusted.control,
                };

                const controls = provider(adjacentBuilder);

                return isAfterEvent(controls) ? controls : afterThe(controls);
              }),
          )
          : afterThe()),
  );
}
