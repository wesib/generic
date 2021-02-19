import { InMode, inModeByValidity, InParents } from '@frontmeans/input-aspects';
import { consumeEvents } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { itsEach } from '@proc7ts/push-iterator';
import { Field } from '../field';
import { Form } from '../form';
import { AbstractFormPreset } from './abstract-form-preset';

export class FormModePreset extends AbstractFormPreset {

  /**
   * @internal
   */
  private readonly _byValidity: InMode.Source | null;

  /**
   * @internal
   */
  private readonly _byForm?: boolean;

  constructor(options: FormModePreset.Options = {}) {
    super();

    const { byValidity, byForm = true } = options;

    this._byValidity = byValidity === false
        ? null
        : inModeByValidity(byValidity === true ? {} : byValidity);
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
    if (this._byValidity) {
      builder.control.setup(InMode, mode => mode.derive(this._byValidity!));
    }
  }

}

export namespace FormModePreset {

  export interface Options {

    readonly byValidity?: Parameters<typeof inModeByValidity>[0] | boolean;

    readonly byForm?: boolean;

  }

}
