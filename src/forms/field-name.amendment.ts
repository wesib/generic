import { InGroup } from '@frontmeans/input-aspects';
import { Amendment } from '@proc7ts/amend';
import { afterAll, consumeEvents, digAfter_ } from '@proc7ts/fun-events';
import { asis, Class, valuesProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentClass } from '@wesib/wesib';
import { SharedDef, shareLocator, ShareLocator } from '../shares';
import { Field } from './field';
import { Field$nameByKey } from './field.impl';
import { Form } from './form';
import { FormUnit } from './form-unit';
import { FormShare } from './form.share';
import { AeSharedField } from './shared-field.amendment';
import { AeSharedFormUnit } from './shared-form-unit.amendment';
import { AeSharedForm } from './shared-form.amendment';

/**
 * Creates a {@link SharedForm shared form} member amendment that adds nested form to enclosing one.
 *
 * @typeParam TForm - Nested form type.
 * @typeParam TModel - Nested form model type.
 * @typeParam TElt - A type of nested HTML form element.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Nested form naming definition.
 *
 * @returns Shared form definition builder.
 */
export function FormName<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>(
    def?: FieldNameDef,
): Amendment<AeSharedForm<TForm, SharedDef.Value<TForm>, TModel, TElt, TClass>> {
  return FormUnitName<TForm, TModel, Form.Controls<TModel, TElt>, TClass>(def);
}

/**
 * Creates a {@link SharedField shared field} member amendment that adds the field to enclosing form.
 *
 * @typeParam TField - Field type.
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field naming definition.
 *
 * @returns Shared field definition builder.
 */
export function FieldName<
    TField extends Field<TFieldValue>,
    TFieldValue = Field.ValueType<TField>,
    TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): Amendment<AeSharedField<TField, SharedDef.Value<TField>, TFieldValue, TClass>> {
  return FormUnitName<TField, TFieldValue, Field.Controls<TFieldValue>, TClass>(def);
}

function FormUnitName<
    TUnit extends FormUnit<TUnitValue, TControls, any>,
    TUnitValue,
    TControls extends FormUnit.Controls<TUnitValue>,
    TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): Amendment<AeSharedFormUnit<TUnit, SharedDef.Value<TUnit>, TUnitValue, TControls, TClass>> {
  return ({
    key,
    share,
    locateForm: defaultForm,
    name: defaultName,
    amend,
  }) => {

    const { name = defaultName } = def;
    let fieldName: string;

    if (name) {
      fieldName = name;
    } else if (name != null) {
      return; // Empty field name. Do not ad it to form.
    } else {

      const autoName = Field$nameByKey(key);

      if (!autoName) {
        return;
      }

      fieldName = autoName;
    }

    const locateForm = shareLocator(def.form || defaultForm, { share: FormShare });

    amend({
      componentDef: {
        setup(setup) {
          setup.whenComponent(context => {
            afterAll({
              unit: context.get(share).do(
                  digAfter_(asis, valuesProvider<[TControls?]>()),
              ),
              form: locateForm(context).do(
                  digAfter_((form?, _sharer?) => form, valuesProvider<[FormUnit.Controls<any>?]>()),
              ),
            }).do(
                consumeEvents(({ unit: [field], form: [form] }): Supply | undefined => {
                  if (!form || !field) {
                    return;
                  }

                  const group = form.control.aspect(InGroup);

                  if (!group) {
                    return;
                  }

                  return group.controls.set(fieldName, field.control);
                }),
            );
          });
        },
      },
    });
  };
}

/**
 * Form field naming definition.
 */
export interface FieldNameDef {

  /**
   * A locator of form unit to add the field to.
   *
   * Either {@link SharedFieldDef.form predefined}, or {@link FormShare default} form share is used when omitted.
   */
  readonly form?: ShareLocator<FormUnit<any>>;

  /**
   * Field name.
   *
   * The shared field will be added to the input control group (`InGroup`) within the {@link form target form},
   * unless the name is empty string.
   *
   * Either {@link SharedFieldDef.name predefined}, or property name is used when omitted.
   */
  readonly name?: string;

}
