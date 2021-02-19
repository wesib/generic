import { InCssClasses, inCssError, inCssInfo } from '@frontmeans/input-aspects';
import { Field } from '../field';
import { Form } from '../form';
import { AbstractFormPreset } from './abstract-form-preset';

export class FormCssPreset extends AbstractFormPreset {

  /**
   * @internal
   */
  private readonly _info: InCssClasses.Source;

  /**
   * @internal
   */
  private readonly _error: InCssClasses.Source;

  constructor(options: FormCssPreset.Options = {}) {
    super();
    this._info = inCssInfo(options.info);
    this._error = inCssError(options.error);
  }

  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {
    builder.control.setup(InCssClasses, css => {
      css.add(this._info);
      css.add(this._error);
    });
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    builder.control.setup(InCssClasses, css => css.add(this._info));
    builder.element.setup(
        InCssClasses,
        (css, element) => css.add(
            element.aspect(Form)!.control.aspect(InCssClasses),
        ),
    );
  }

}

export namespace FormCssPreset {

  export interface Options {

    readonly info?: Parameters<typeof inCssInfo>[0];

    readonly error?: Parameters<typeof inCssError>[0];

  }

}
