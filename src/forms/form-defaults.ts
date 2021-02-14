import { ContextKey__symbol, ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, AfterEvent__symbol, EventKeeper, mapAfter } from '@proc7ts/fun-events';
import { Field } from './field';
import { Form } from './form';

class FormDefaultsKey extends ContextUpKey<FormDefaults, FormDefaults.Spec> {

  constructor() {
    super('form-defaults');
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          FormDefaults,
          ContextUpKey.Source<FormDefaults.Spec>,
          AfterEvent<FormDefaults.Spec[]>>,
  ): void {
    slot.insert(new FormDefaults(slot.seed.do(
      mapAfter((...specs: FormDefaults.Spec[]): FormDefaults.Rules => ({
        setupField: FormDefaults$setupField(specs),
        setupForm: FormDefaults$setupForm(specs),
      })),
    )));
  }

}

const FormDefaults__key = (/*#__PURE__*/ new FormDefaultsKey());
const FormDefaults$rules__symbol = (/*#__PURE__*/ Symbol('FormDefaults.rules'));

export class FormDefaults implements FormDefaults.Rules, EventKeeper<[FormDefaults.Rules]> {

  static get [ContextKey__symbol](): ContextUpKey<FormDefaults, FormDefaults.Spec> {
    return FormDefaults__key;
  }

  /**
   * @internal
   */
  private [FormDefaults$rules__symbol]: FormDefaults.Rules;

  constructor(readonly rules: AfterEvent<[FormDefaults.Rules]>) {
    rules(rules => {
      this[FormDefaults$rules__symbol] = rules;
    });
  }

  [AfterEvent__symbol](): AfterEvent<[FormDefaults.Rules]> {
    return this.rules;
  }

  setupField<TValue, TSharer extends object>(
      field: Field<TValue, TSharer>,
      controls: AfterEvent<[Field.Controls<TValue>]>,
  ): AfterEvent<[Field.Controls<TValue>]> {
    return this[FormDefaults$rules__symbol].setupField(field, controls);
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      form: Form<TModel, TElt, TSharer>,
      controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> {
    return this[FormDefaults$rules__symbol].setupForm(form, controls);
  }

}

export namespace FormDefaults {

  export interface Spec {

    setupField?<TValue, TSharer extends object>(
        field: Field<TValue, TSharer>,
        controls: AfterEvent<[Field.Controls<TValue>]>,
    ): AfterEvent<[Field.Controls<TValue>]>;

    setupForm?<TModel, TElt extends HTMLElement, TSharer extends object>(
        form: Form<TModel, TElt, TSharer>,
        controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
    ): AfterEvent<[Form.Controls<TModel, TElt>]>;

  }

  export interface Rules extends FormDefaults.Spec {

    setupField<TValue, TSharer extends object>(
        this: void,
        field: Field<TValue, TSharer>,
        controls: AfterEvent<[Field.Controls<TValue>]>,
    ): AfterEvent<[Field.Controls<TValue>]>;

    setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
        this: void,
        form: Form<TModel, TElt, TSharer>,
        controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
    ): AfterEvent<[Form.Controls<TModel, TElt>]>;

  }

}

function FormDefaults$setupField(
    specs: readonly FormDefaults.Spec[],
): <TValue, TSharer extends object>(
    field: Field<TValue, TSharer>,
    controls: AfterEvent<[Field.Controls<TValue>]>,
) => AfterEvent<[Field.Controls<TValue>]> {
  return specs.reduce(
      (prev, spec) => spec.setupField
          ? <TValue, TSharer extends object>(
              field: Field<TValue, TSharer>,
              controls: AfterEvent<[Field.Controls<TValue>]>,
          ): AfterEvent<[Field.Controls<TValue>]> => spec.setupField!(field, prev(field, controls))
          : prev,
      <TValue, TSharer extends object>(
          _field: Field<TValue, TSharer>,
          controls: AfterEvent<[Field.Controls<TValue>]>,
      ): AfterEvent<[Field.Controls<TValue>]> => controls,
  );
}

function FormDefaults$setupForm(
    specs: readonly FormDefaults.Spec[],
): <TModel, TElt extends HTMLElement, TSharer extends object>(
    form: Form<TModel, TElt, TSharer>,
    controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
) => AfterEvent<[Form.Controls<TModel, TElt>]> {
  return specs.reduce(
      (prev, spec) => spec.setupForm
          ? <TModel, TElt extends HTMLElement, TSharer extends object>(
              form: Form<TModel, TElt, TSharer>,
              controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
          ): AfterEvent<[Form.Controls<TModel, TElt>]> => spec.setupForm!(form, prev(form, controls))
          : prev,
      <TModel, TElt extends HTMLElement, TSharer extends object>(
          _form: Form<TModel, TElt, TSharer>,
          controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
      ): AfterEvent<[Form.Controls<TModel, TElt>]> => controls,
  );
}
