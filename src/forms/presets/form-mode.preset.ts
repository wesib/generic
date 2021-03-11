import { InControl, InMode, inModeByValidity, InParents } from '@frontmeans/input-aspects';
import { consumeEvents } from '@proc7ts/fun-events';
import { itsEach } from '@proc7ts/push-iterator';
import { Supply } from '@proc7ts/supply';
import { Field } from '../field';
import { Form } from '../form';
import { FormScope } from '../form-scope';
import { ScopedFormConfig } from '../scoped-form-config';
import { AbstractFormPreset } from './abstract-form-preset';

/**
 * Form preset that enables default form and field mode management.
 *
 * - Makes form mode depend on its validity (`inModeByValidity()`).
 * - Derives form field's mode from form element's one.
 */
export class FormModePreset extends AbstractFormPreset {

  /**
   * @internal
   */
  private readonly _byValidity: (control: InControl<any>) => Supply;

  /**
   * @internal
   */
  private readonly _byForm: (control: InControl<any>) => Supply;

  /**
   * Constructs customized form mode preset.
   *
   * @param options - Custom form mode preset options.
   */
  constructor(options: FormModePreset.Options = {}) {
    super();
    this._byValidity = ScopedFormConfig.createSetup(
        options.byValidity,
        opts => {

          const src = inModeByValidity(opts);

          return control => control.aspect(InMode).derive(src);
        },
    );
    this._byForm = FormScope.createSetup(
        options.byForm,
        control => control.aspect(InParents).read.do(
            consumeEvents(parents => {

              const supply = new Supply();

              itsEach(
                  parents,
                  ({ parent }) => {

                    const form = parent.aspect(Form);

                    if (form) {
                      control.aspect(InMode).derive(form.element.aspect(InMode)).as(supply);
                    }
                  },
              );

              return supply;
            }),
        ),
    );
  }

  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {
    builder.control.setup(this._byForm);
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    builder.control.setup(this._byValidity);
  }

}

export namespace FormModePreset {

  /**
   * Form mode preset options.
   */
  export interface Options {

    /**
     * Whether to build a form mode by its validity options.
     *
     * `false` to disable.
     */
    readonly byValidity?: ScopedFormConfig<Parameters<typeof inModeByValidity>[0]>;

    /**
     * Whether form field mode should be derived from form element's one.
     *
     * `true` by default. `false` to disable.
     */
    readonly byForm?: FormScope;

  }

}
