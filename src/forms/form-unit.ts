import { InControl } from '@frontmeans/input-aspects';
import { Contextual__symbol } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { Shareable } from '../shares';

/**
 * Abstract unit of input {@link Form form}.
 *
 * Represents a form or its field control and contains its value.
 *
 * @typeParam TValue - Input value type.
 * @typeParam TControls - A type of input controls this unit represents.
 * @typeParam TSharer - Unit sharer component type.
 */
export abstract class FormUnit<
    TValue,
    TControls extends FormUnit.Controls<TValue> = FormUnit.Controls<TValue>,
    TSharer extends object = any>
    extends Shareable<TControls | undefined, TSharer> {

  /**
   * Constructs form unit.
   *
   * @param controls - Either input controls, or their provider.
   */
  constructor(// eslint-disable-line @typescript-eslint/no-useless-constructor
      controls: TControls | Shareable.Provider<TControls | undefined, TSharer>,
  ) {
    super(controls);
  }

  /**
   * Input control of the field, if present.
   */
  get control(): InControl<TValue> | undefined {
    return this.body?.control;
  }

  [Contextual__symbol](sharer: ComponentContext): this {
    super[Contextual__symbol](sharer);
    this.read(noop).needs(sharer); // Create controls eagerly.
    return this;
  }

}

export namespace FormUnit {

  /**
   * A value type for the given form unit type.
   *
   * @typeParam TUnit - Target unit type.
   */
  export type ValueType<TUnit extends FormUnit<any, any, any>> =
      TUnit extends FormUnit<infer TValue, any, any> ? TValue : never;

  /**
   * A type of controls type for the given form unit type.
   *
   * @typeParam TUnit - Target unit type.
   */
  export type ControlsType<TUnit extends FormUnit<any, any, any>> =
      TUnit extends FormUnit<any, infer TControls, any> ? TControls : never;

  /**
   * A type of the sharer for the given form unit type.
   *
   * @typeParam TUnit - Target unit type.
   */
  export type SharerType<TUnit extends FormUnit<any, any, any>> =
      TUnit extends FormUnit<any, any, infer TSharer> ? TSharer : never;

  /**
   * Form unit controls.
   *
   * @typeParam TValue - Input value type.
   */
  export interface Controls<TValue> {

    /**
     * An input control of the unit.
     */
    readonly control: InControl<TValue>;

  }

}
