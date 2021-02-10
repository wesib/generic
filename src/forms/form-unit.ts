import { InControl } from '@frontmeans/input-aspects';
import { ShareableByComponent } from '../share';

/**
 * Abstract unit of input {@link Form form}.
 *
 * Represents a form or its field control and contains its value.
 *
 * @typeParam TUnit - A type of form unit.
 * @typeParam TValue - Input value type.
 * @typeParam TSharer - Unit sharer component type.
 * @typeParam TControls - A type of input controls this unit represents.
 */
export abstract class FormUnit<
    TUnit extends FormUnit<TUnit, TValue, TSharer, TControls>,
    TValue,
    TSharer extends object = any,
    TControls extends FormUnit.Controls<TValue> = FormUnit.Controls<TValue>>
    extends ShareableByComponent<TUnit, TSharer, TControls>
    implements FormUnit.Controls<TValue> {

  /**
   * Constructs form unit.
   *
   * @param controls - Either input controls, or their provider.
   */
  constructor(// eslint-disable-line @typescript-eslint/no-useless-constructor
      controls: TControls | ShareableByComponent.Provider<TSharer, TControls>,
  ) {
    super(controls);
  }

  /**
   * Input control.
   */
  get control(): InControl<TValue> {
    return this.internals.control;
  }

}

export namespace FormUnit {

  /**
   * A value type of the given form unit.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export type ValueType<TUnit extends FormUnit<any, any>> =
      TUnit extends FormUnit<any, infer TValue> ? TValue : never;

  /**
   * Form unit controls.
   */
  export interface Controls<TValue> {

    /**
     * An input control of the unit.
     */
    readonly control: InControl<TValue>;

  }

}
