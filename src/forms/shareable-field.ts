import { InControl } from '@frontmeans/input-aspects';
import { ShareableByComponent } from '../share/shareable-by-component';

/**
 * Abstract field of the user input {@link Form form}.
 *
 * @typeParam TField - Shareable field type.
 * @typeParam TValue - Field value type.
 * @typeParam TSharer - Field sharer component type.
 * @typeParam TControls - A type of form field controls.
 */
export abstract class ShareableField<
    TField extends ShareableField<TField, TValue, TSharer, TControls>,
    TValue,
    TSharer extends object = any,
    TControls extends ShareableField.Controls<TValue> = ShareableField.Controls<TValue>>
    extends ShareableByComponent<TField, TSharer, TControls>
    implements ShareableField.Controls<TValue> {

  /**
   * Constructs shareable field.
   *
   * @param controls - Either input controls, or their provider.
   */
  constructor(// eslint-disable-line @typescript-eslint/no-useless-constructor
      controls: TControls | ShareableByComponent.Provider<TSharer, TControls>,
  ) {
    super(controls);
  }

  /**
   * Field input control.
   */
  get control(): InControl<TValue> {
    return this.internals.control;
  }

}

export namespace ShareableField {

  /**
   * Shareable field controls provider signature.
   *
   * @typeParam TValue - Field value type.
   * @typeParam TSharer - Field sharer component type.
   */
  export type ValueType<TField extends ShareableField<any, any>> =
      TField extends ShareableField<any, infer TValue> ? TValue : never;

  /**
   * Shareable field controls.
   */
  export interface Controls<TValue> {

    /**
     * Field input control.
     */
    readonly control: InControl<TValue>;

  }

}
