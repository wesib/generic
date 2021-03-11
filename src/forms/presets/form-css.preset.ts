import { InControl, InCssClasses, inCssError, inCssInfo } from '@frontmeans/input-aspects';
import { Supply } from '@proc7ts/supply';
import { Field } from '../field';
import { Form } from '../form';
import { ScopedFormConfig } from '../scoped-form-config';
import { AbstractFormPreset } from './abstract-form-preset';

/**
 * Form preset that enables CSS class indication of form and field states.
 *
 * - Enables CSS info classes (`inCssInfo()`) for forms and fields.
 * - Enables error indication (`inCssError()`) for fields.
 */
export class FormCssPreset extends AbstractFormPreset {

  /**
   * @internal
   */
  private readonly _info: (control: InControl<any>) => Supply;

  /**
   * @internal
   */
  private readonly _error: (control: InControl<any>) => Supply;

  /**
   * Constructs customized form CSS preset.
   *
   * @param options - Custom form CSS preset options.
   */
  constructor(options: FormCssPreset.Options = {}) {
    super();
    this._info = ScopedFormConfig.createSetup(
        options.info,
        opts => {

          const src = inCssInfo(opts);

          return control => control.aspect(InCssClasses).add(src);
        },
    );
    this._error = ScopedFormConfig.createSetup(
        options.error,
        opts => {

          const src = inCssError(opts);

          return control => control.aspect(InCssClasses).add(src);
        },
    );
  }

  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {
    builder.control.setup(this._info).setup(this._error);
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    builder.control.setup(this._info);
    builder.element.setup(
        InCssClasses,
        (css, element) => css.add(
            element.aspect(Form)!.control.aspect(InCssClasses),
        ),
    );
  }

}

export namespace FormCssPreset {

  /**
   * Form CSS preset options.
   */
  export interface Options {

    /**
     * CSS info options.
     *
     * `false` to disable.
     */
    readonly info?: ScopedFormConfig<Parameters<typeof inCssInfo>[0]>;

    /**
     * CSS error indication options.
     *
     * `false` to disable.
     */
    readonly error?: ScopedFormConfig<Parameters<typeof inCssError>[0]>;

  }

}
