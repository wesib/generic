import { ContextKey__symbol, ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, afterThe, digAfter, isAfterEvent, mapAfter } from '@proc7ts/fun-events';
import { Field } from './field';
import { Form } from './form';

class FormDefaultsKey extends ContextUpKey<AfterEvent<[FormDefaults]>, FormDefaults.Rules> {

  constructor() {
    super('form-defaults');
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[FormDefaults]>,
          ContextUpKey.Source<FormDefaults.Rules>,
          AfterEvent<FormDefaults.Rules[]>>,
  ): void {
    slot.insert(slot.seed.do(
        mapAfter((...rules) => new FormDefaults(...rules)),
    ));
  }

}

const FormDefaults__key = (/*#__PURE__*/ new FormDefaultsKey());

export class FormDefaults {

  static [ContextKey__symbol](): ContextUpKey<AfterEvent<[FormDefaults]>, FormDefaults.Rules> {
    return FormDefaults__key;
  }

  readonly setupField: <TValue, TSharer extends object>(
      field: Field<TValue, TSharer>,
      controls: Field.Controls<TValue>,
  ) => AfterEvent<[Field.Controls<TValue>]>;

  readonly setupForm: <TModel, TElt extends HTMLElement, TSharer extends object>(
      form: Form<TModel, TElt, TSharer>,
      controls: Form.Controls<TModel, TElt>,
  ) => AfterEvent<[Form.Controls<TModel, TElt>]>;

  constructor(...rules: FormDefaults.Rules[]) {
    this.setupField = FormDefaults$setupField(rules);
    this.setupForm = FormDefaults$setupForm(rules);
  }

}

export namespace FormDefaults {

  export interface Rules {

    setupField?<TValue, TSharer extends object>(
        field: Field<TValue, TSharer>,
        controls: Field.Controls<TValue>,
    ): AfterEvent<[Field.Controls<TValue>]> | Field.Controls<TValue> | void;

    setupForm?<TModel, TElt extends HTMLElement, TSharer extends object>(
        form: Form<TModel, TElt, TSharer>,
        controls: Form.Controls<TModel, TElt>,
    ): AfterEvent<[Form.Controls<TModel, TElt>]> | Form.Controls<TModel, TElt> | void;
  }

}

function FormDefaults$setupField(
    rules: readonly FormDefaults.Rules[],
): <TValue, TSharer extends object>(
    field: Field<TValue, TSharer>,
    controls: Field.Controls<TValue>,
) => AfterEvent<[Field.Controls<TValue>]> {
  return rules.reduce(
      (prev, rule) => rule.setupField
          ? <TValue, TSharer extends object>(
              field: Field<TValue, TSharer>,
              controls: Field.Controls<TValue>,
          ): AfterEvent<[Field.Controls<TValue>]> => prev(field, controls).do(
              digAfter((prevControls: Field.Controls<TValue>): AfterEvent<[Field.Controls<TValue>]> => {

                const nextControls = rule.setupField!(field, prevControls);

                return isAfterEvent(nextControls)
                    ? nextControls
                    : afterThe(nextControls || prevControls);
              }),
          )
          : prev,
      <TValue, TSharer extends object>(
          _field: Field<TValue, TSharer>,
          controls: Field.Controls<TValue>,
      ): AfterEvent<[Field.Controls<TValue>]> => afterThe(controls),
  );
}

function FormDefaults$setupForm(
    rules: readonly FormDefaults.Rules[],
): <TModel, TElt extends HTMLElement, TSharer extends object>(
    form: Form<TModel, TElt, TSharer>,
    controls: Form.Controls<TModel, TElt>,
) => AfterEvent<[Form.Controls<TModel, TElt>]> {
  return rules.reduce(
      (prev, rule) => rule.setupForm
          ? <TModel, TElt extends HTMLElement, TSharer extends object>(
              form: Form<TModel, TElt, TSharer>,
              controls: Form.Controls<TModel, TElt>,
          ): AfterEvent<[Form.Controls<TModel, TElt>]> => prev(form, controls).do(
              digAfter((prevControls: Form.Controls<TModel, TElt>): AfterEvent<[Form.Controls<TModel, TElt>]> => {

                const nextControls = rule.setupForm!(form, prevControls);

                return isAfterEvent(nextControls)
                    ? nextControls
                    : afterThe(nextControls || prevControls);
              }),
          )
          : prev,
      <TModel, TElt extends HTMLElement, TSharer extends object>(
          _form: Form<TModel, TElt, TSharer>,
          controls: Form.Controls<TModel, TElt>,
      ): AfterEvent<[Form.Controls<TModel, TElt>]> => afterThe(controls),
  );
}
