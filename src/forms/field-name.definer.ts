import { InGroup } from '@frontmeans/input-aspects';
import { afterAll, consumeEvents } from '@proc7ts/fun-events';
import { Class, Supply } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareRef } from '../share';
import { Field } from './field';
import { Field$nameByKey } from './field.impl';
import { Form } from './form';
import { FormShare } from './form.share';
import { SharedField } from './shared-field.decorator';
import { SharedForm } from './shared-form.decorator';

/**
 * Builds a {@link SharedForm shared form} definition builder that adds nested form to enclosing one.
 *
 * @typeParam TForm - Nested form type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Nested form naming definition.
 *
 * @returns Shared form definition builder.
 */
export function FormName<TForm extends Form<any, any>, TClass extends ComponentClass = Class>(
    def?: FieldNameDef,
): SharedForm.Definer<TForm, TClass> {
  return FieldName(def);
}

/**
 * Builds a {@link SharedField shared form field} definition builder that adds the field to enclosing form.
 *
 * @typeParam TField - Field type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field naming definition.
 *
 * @returns Shared field definition builder.
 */
export function FieldName<TField extends Field<any>, TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): SharedField.Definer<TField, TClass> {
  return ({
    key,
    share,
    formShare,
    name: defaultName,
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

    const fieldFormShare = (def.form || formShare || FormShare)[ComponentShare__symbol];

    return {
      componentDef: {
        setup(setup) {
          setup.whenComponent(context => {
            afterAll({
              field: context.get(share),
              form: fieldFormShare.valueFor(context),
            }).do(
                consumeEvents(({ field: [field], form: [form] }): Supply | undefined => {
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
    };
  };
}

/**
 * Form field naming definition.
 */
export interface FieldNameDef {

  /**
   * A form to add the field to.
   *
   * This is a reference to the form share.
   *
   * Either {@link SharedFieldDef.form predefined}, or {@link FieldShare default} form share is used when omitted.
   */
  readonly form?: ComponentShareRef<Form>;

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
