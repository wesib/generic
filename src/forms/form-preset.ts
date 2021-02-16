import { ContextKey__symbol, ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, AfterEvent__symbol, EventKeeper, mapAfter } from '@proc7ts/fun-events';
import { Field } from './field';
import { Form } from './form';

class FormPresetKey extends ContextUpKey<FormPreset, FormPreset.Spec> {

  constructor() {
    super('form-preset');
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          FormPreset,
          ContextUpKey.Source<FormPreset.Spec>,
          AfterEvent<FormPreset.Spec[]>>,
  ): void {
    slot.insert(new FormPreset(slot.seed.do(
      mapAfter((...specs: FormPreset.Spec[]): FormPreset.Rules => ({
        setupField: FormDefaults$setupField(specs),
        setupForm: FormDefaults$setupForm(specs),
      })),
    )));
  }

}

const FormPreset__key = (/*#__PURE__*/ new FormPresetKey());
const FormPreset$rules__symbol = (/*#__PURE__*/ Symbol('FormPreset.rules'));

/**
 * Form controls preset.
 *
 * Any number of presets can be {@link FormPreset.Spec specified} in component context to be applies to forms
 * and fields. They would be combined into single preset available in component context.
 */
export class FormPreset implements FormPreset.Rules, EventKeeper<[FormPreset.Rules]> {

  /**
   * A key of component context value containing default form preset combined from all provided {@link FormPreset.Spec
   * specifiers}.
   */
  static get [ContextKey__symbol](): ContextUpKey<FormPreset, FormPreset.Spec> {
    return FormPreset__key;
  }

  /**
   * @internal
   */
  private [FormPreset$rules__symbol]: FormPreset.Rules;

  constructor(readonly rules: AfterEvent<[FormPreset.Rules]>) {
    rules(rules => {
      this[FormPreset$rules__symbol] = rules;
    });
  }

  /**
   * Builds an `AfterEvent` keeper of this form preset {@link FormPreset.Rules rules}.
   */
  [AfterEvent__symbol](): AfterEvent<[FormPreset.Rules]> {
    return this.rules;
  }

  /**
   * Sets up a form field controls.
   *
   * @param controls - An `AfterEvent` keeper of target field controls.
   * @param field - Target field instance.
   *
   * @returns An `AfterEvent` keeper of modified field controls.
   */
  setupField<TValue, TSharer extends object>(
      controls: AfterEvent<[Field.Controls<TValue>]>,
      field: Field<TValue, TSharer>,
  ): AfterEvent<[Field.Controls<TValue>]> {
    return this[FormPreset$rules__symbol].setupField(controls, field);
  }

  /**
   * Sets up a form controls.
   *
   * @param controls - An `AfterEvent` keeper of target field controls.
   * @param form - Target form instance.
   *
   * @returns An `AfterEvent` keeper of modified form controls.
   */
  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
      form: Form<TModel, TElt, TSharer>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> {
    return this[FormPreset$rules__symbol].setupForm(controls, form);
  }

}

export namespace FormPreset {

  /**
   * A {@link FormPreset form preset} specifier.
   *
   * Contains a partial form preset implementation.
   */
  export interface Spec {

    /**
     * Sets up a form field controls.
     *
     * @param controls - An `AfterEvent` keeper of target field controls.
     * @param field - Target field instance.
     *
     * @returns An `AfterEvent` keeper of modified field controls.
     */
    setupField?<TValue, TSharer extends object>(
        controls: AfterEvent<[Field.Controls<TValue>]>,
        field: Field<TValue, TSharer>,
    ): AfterEvent<[Field.Controls<TValue>]>;

    /**
     * Sets up a form controls.
     *
     * @param controls - An `AfterEvent` keeper of target field controls.
     * @param form - Target form instance.
     *
     * @returns An `AfterEvent` keeper of modified form controls.
     */
    setupForm?<TModel, TElt extends HTMLElement, TSharer extends object>(
        controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
        form: Form<TModel, TElt, TSharer>,
    ): AfterEvent<[Form.Controls<TModel, TElt>]>;

  }

  /**
   * {@link FormPreset Form preset} rules.
   *
   * Combines multiple {@link Spec specifiers}.
   */
  export interface Rules extends FormPreset.Spec {

    setupField<TValue, TSharer extends object>(
        this: void,
        controls: AfterEvent<[Field.Controls<TValue>]>,
        field: Field<TValue, TSharer>,
    ): AfterEvent<[Field.Controls<TValue>]>;

    setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
        this: void,
        controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
        form: Form<TModel, TElt, TSharer>,
    ): AfterEvent<[Form.Controls<TModel, TElt>]>;

  }

}

function FormDefaults$setupField(
    specs: readonly FormPreset.Spec[],
): <TValue, TSharer extends object>(
    controls: AfterEvent<[Field.Controls<TValue>]>,
    field: Field<TValue, TSharer>,
) => AfterEvent<[Field.Controls<TValue>]> {
  return specs.reduce(
      (prev, spec) => spec.setupField
          ? <TValue, TSharer extends object>(
              controls: AfterEvent<[Field.Controls<TValue>]>,
              field: Field<TValue, TSharer>,
          ): AfterEvent<[Field.Controls<TValue>]> => spec.setupField!(prev(controls, field), field)
          : prev,
      <TValue, TSharer extends object>(
          controls: AfterEvent<[Field.Controls<TValue>]>,
          _field: Field<TValue, TSharer>,
      ): AfterEvent<[Field.Controls<TValue>]> => controls,
  );
}

function FormDefaults$setupForm(
    specs: readonly FormPreset.Spec[],
): <TModel, TElt extends HTMLElement, TSharer extends object>(
    controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
    form: Form<TModel, TElt, TSharer>,
) => AfterEvent<[Form.Controls<TModel, TElt>]> {
  return specs.reduce(
      (prev, spec) => spec.setupForm
          ? <TModel, TElt extends HTMLElement, TSharer extends object>(
              controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
              form: Form<TModel, TElt, TSharer>,
          ): AfterEvent<[Form.Controls<TModel, TElt>]> => spec.setupForm!(prev(controls, form), form)
          : prev,
      <TModel, TElt extends HTMLElement, TSharer extends object>(
          controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
          _form: Form<TModel, TElt, TSharer>,
      ): AfterEvent<[Form.Controls<TModel, TElt>]> => controls,
  );
}
