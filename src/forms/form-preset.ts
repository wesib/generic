import { ContextKey__symbol, ContextSupply, ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, AfterEvent__symbol, EventKeeper, mapAfter, supplyAfter } from '@proc7ts/fun-events';
import { DefaultFormPreset } from './default.preset.impl';
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
        mapAfter((...specs) => FormPreset.combine(...specs, DefaultFormPreset)),
        supplyAfter(slot.context.get(ContextSupply)),
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
   *
   * As a bare minimum it attaches the following aspects to controls:
   *
   * - `InRenderScheduler` set to `ElementRenderScheduler`,
   * - `InNamespaceAliaser` set to `DefaultNamespaceAliaser.
   */
  static get [ContextKey__symbol](): ContextUpKey<FormPreset, FormPreset.Spec> {
    return FormPreset__key;
  }

  /**
   * Combines form preset specifiers.
   *
   * @param specs - Form preset specifiers to combine.
   *
   * @returns Form preset rules instance combining the given specifiers.
   */
  static combine(...specs: FormPreset.Spec[]): FormPreset.Rules {
    return {
      setupField: FormPreset$setupField(specs),
      setupForm: FormPreset$setupForm(specs),
    };
  }

  /**
   * @internal
   */
  private [FormPreset$rules__symbol]: FormPreset.Rules;

  /**
   * Constructs form preset.
   *
   * @param rules - An `AfterEvent` keeper of form preset {@link FormPreset.Rules rules}.
   */
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
   * Sets up form field controls.
   *
   * @param builder - Target field builder.
   */
  setupField<TValue, TSharer extends object>(
      builder: Field.Builder<TValue, TSharer>,
  ): void {
    this[FormPreset$rules__symbol].setupField(builder);
  }

  /**
   * Sets up form controls.
   *
   * @param builder - Target form builder.
   */
  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    this[FormPreset$rules__symbol].setupForm(builder);
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
     * Sets up form field controls.
     *
     * @param builder - Target field builder.
     */
    setupField?<TValue, TSharer extends object>(
        builder: Field.Builder<TValue, TSharer>,
    ): void;

    /**
     * Sets up form controls.
     *
     * @param builder - Target form builder.
     */
    setupForm?<TModel, TElt extends HTMLElement, TSharer extends object>(
        builder: Form.Builder<TModel, TElt, TSharer>,
    ): void;

  }

  /**
   * {@link FormPreset Form preset} rules.
   *
   * Multiple {@link Spec specifiers} could be combined into single rule instance by {@link FormPreset.combine} static
   * method.
   */
  export interface Rules extends FormPreset.Spec {

    setupField<TValue, TSharer extends object>(
        this: void,
        builder: Field.Builder<TValue, TSharer>,
    ): void;

    setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
        this: void,
        builder: Form.Builder<TModel, TElt, TSharer>,
    ): void;

  }

}

function FormPreset$setupField(
    specs: readonly FormPreset.Spec[],
): <TValue, TSharer extends object>(
    builder: Field.Builder<TValue, TSharer>,
) => void {
  return specs.reduce(
      (prev, spec) => spec.setupField
          ? <TValue, TSharer extends object>(
              builder: Field.Builder<TValue, TSharer>,
          ): void => {
            prev(builder);
            spec.setupField!(builder);
          }
          : prev,
      FormPreset$noFieldSetup,
  );
}

function FormPreset$noFieldSetup<TValue, TSharer extends object>(
    _builder: Field.Builder<TValue, TSharer>,
): void {
  // No field setup
}

function FormPreset$setupForm(
    specs: readonly FormPreset.Spec[],
): <TModel, TElt extends HTMLElement, TSharer extends object>(
    builder: Form.Builder<TModel, TElt, TSharer>,
) => void {
  return specs.reduce(
      (prev, spec) => spec.setupForm
          ? <TModel, TElt extends HTMLElement, TSharer extends object>(
              builder: Form.Builder<TModel, TElt, TSharer>,
          ): void => {
            prev(builder);
            spec.setupForm!(builder);
          }
          : prev,
      FormPreset$noFormSetup,
  );
}

function FormPreset$noFormSetup<TModel, TElt extends HTMLElement, TSharer extends object>(
    _builder: Form.Builder<TModel, TElt, TSharer>,
): void {
  // No form setup
}
