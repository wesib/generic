import { InMode, inModeByValidity, InParents } from '@frontmeans/input-aspects';
import { AfterEvent, mapAfter } from '@proc7ts/fun-events';
import { itsEach } from '@proc7ts/push-iterator';
import { Field } from '../field';
import { Form } from '../form';
import { AbstractFormPreset } from './abstract-form-preset';

export class FormModePreset extends AbstractFormPreset {

  /**
   * @internal
   */
  private readonly _byValidity: InMode.Source;

  private readonly _byForm?: boolean;

  constructor(options: FormModePreset.Options = {}) {
    super();

    const { byValidity, byForm = true } = options;

    this._byValidity = inModeByValidity(byValidity);
    this._byForm = byForm;
  }

  setupField<TValue, TSharer extends object>(
      controls: AfterEvent<[Field.Controls<TValue>]>,
      _field: Field<TValue, TSharer>,
  ): AfterEvent<[Field.Controls<TValue>]> {
    return this._byForm
        ? controls.do(
            mapAfter(controls => {

              controls.control.aspect(InParents).read(parents => {
                itsEach(
                    parents,
                    ({ parent }) => controls.control
                        .aspect(InMode)
                        .derive(parent.aspect(InMode)),
                );
              });

              return controls;
            }),
        )
        : controls;
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
      _form: Form<TModel, TElt, TSharer>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> {
    return controls.do(
        mapAfter(controls => {
          controls.control.setup(InMode, mode => mode.derive(this._byValidity));
          return controls;
        }),
    );
  }

}

export namespace FormModePreset {

  export interface Options {

    readonly byValidity?: Parameters<typeof inModeByValidity>[0];

    readonly byForm?: boolean;

  }

}
