import { InCssClasses, inCssError, inCssInfo } from '@frontmeans/input-aspects';
import { Field } from '../field';
import { Form } from '../form';
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
  private readonly _info: InCssClasses.Source | null;

  /**
   * @internal
   */
  private readonly _error: InCssClasses.Source | null;

  /**
   * Constructs customized form CSS preset.
   *
   * @param options - Custom form CSS preset options.
   */
  constructor(options: FormCssPreset.Options = {}) {
    super();

    const { info = true, error = true } = options;

    this._info = info ? inCssInfo(info === true ? undefined : info) : null;
    this._error = error ? inCssError(error === true ? undefined : error) : null;
  }

  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {

    const { _info: info, _error: error } = this;

    if (info) {
      builder.control.setup(InCssClasses, css => css.add(info));
    }
    if (error) {
      builder.control.setup(InCssClasses, css => css.add(error));
    }
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {

    const { _info: info } = this;

    if (info) {
      builder.control.setup(InCssClasses, css => css.add(info));
    }
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
    readonly info?: Parameters<typeof inCssInfo>[0] | boolean;

    /**
     * CSS error indication options.
     *
     * `false` to disable.
     */
    readonly error?: Parameters<typeof inCssError>[0] | boolean;

  }

}
