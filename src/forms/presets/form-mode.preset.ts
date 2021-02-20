import { InMode, inModeByValidity, InParents } from '@frontmeans/input-aspects';
import { consumeEvents } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { itsEach } from '@proc7ts/push-iterator';
import { Field } from '../field';
import { Form } from '../form';
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
  private readonly _byValidity: InMode.Source | null;

  /**
   * @internal
   */
  private readonly _byForm?: boolean;

  /**
   * Constructs customized form mode preset.
   *
   * @param options - Custom form mode preset options.
   */
  constructor(options: FormModePreset.Options = {}) {
    super();

    const { byValidity = true, byForm = true } = options;

    this._byValidity = byValidity ? inModeByValidity(byValidity === true ? undefined : byValidity) : null;
    this._byForm = byForm;
  }

  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {
    if (this._byForm) {
      builder.control.setup(
          InParents,
          (inParents, control) => inParents.read.do(
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
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {

    const { _byValidity: byValidity } = this;

    if (byValidity) {
      builder.control.setup(InMode, mode => mode.derive(byValidity));
    }
  }

}

export namespace FormModePreset {

  /**
   * Form mode preset options.
   */
  export interface Options {

    /**
     * For mode by its validity options.
     *
     * `false` to disable.
     */
    readonly byValidity?: Parameters<typeof inModeByValidity>[0] | boolean;

    /**
     * Whether form field mode should be derived from form element's one.
     *
     * `true` by default. `false` to disable.
     */
    readonly byForm?: boolean;

  }

}
