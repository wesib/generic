import { InCssClasses, inCssError, inCssInfo } from '@frontmeans/input-aspects';
import { AfterEvent, mapAfter } from '@proc7ts/fun-events';
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
      controls: AfterEvent<[Field.Controls<TValue>]>,
      _field: Field<TValue, TSharer>,
  ): AfterEvent<[Field.Controls<TValue>]> {
    return controls.do(
        mapAfter(controls => {
          controls.control.setup(InCssClasses, css => {
            css.add(this._info);
            css.add(this._error);
          });
          return controls;
        }),
    );
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
      _form: Form<TModel, TElt, TSharer>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> {
    return controls.do(
        mapAfter(controls => {
          controls.control.setup(InCssClasses, css => css.add(this._info));
          controls.element.setup(InCssClasses, css => css.add(controls.control.aspect(InCssClasses)));
          return controls;
        }),
    );
  }

}

export namespace FormCssPreset {

  export interface Options {

    readonly info?: Parameters<typeof inCssInfo>[0];

    readonly error?: Parameters<typeof inCssError>[0];

  }

}
