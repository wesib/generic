import { InControl } from '@frontmeans/input-aspects';
import { AfterEvent, AfterEvent__symbol } from '@proc7ts/fun-events';
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
   * An `AfterEvent` keeper of form unit controls.
   */
  get readControls(): AfterEvent<[TControls?]> {
    return this[AfterEvent__symbol]();
  }

  /**
   * Input control of the field, if present.
   */
  get control(): InControl<TValue> | undefined {
    return this.internals?.control;
  }

}

export namespace FormUnit {

  /**
   * A value type of the given form unit.
   *
   * @typeParam TUnit - Target unit type.
   */
  export type ValueType<TUnit extends FormUnit<any, any, any>> =
      TUnit extends FormUnit<infer TValue, any, any> ? TValue : never;

  /**
   * A controls type of the given form unit.
   *
   * @typeParam TUnit - Target unit type.
   */
  export type ControlsType<TUnit extends FormUnit<any, any, any>> =
      TUnit extends FormUnit<any, any, infer TControls> ? TControls : never;

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
