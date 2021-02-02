import { InGroup } from '@frontmeans/input-aspects';
import { afterAll, consumeEvents } from '@proc7ts/fun-events';
import { Class, Supply } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareRef } from '../share';
import { Field$nameByKey } from './field.impl';
import { Form } from './form';
import { SharedField } from './shared-field.decorator';

export function FieldName<TValue, TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): SharedField.Definer<TValue, TClass> {
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

    const fieldFormShare = (def.formShare || formShare)[ComponentShare__symbol]();

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

export interface FieldNameDef {

  readonly formShare?: ComponentShareRef<Form>;

  readonly name?: string;

}
