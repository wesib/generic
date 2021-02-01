import { InControl } from '@frontmeans/input-aspects';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { FieldName } from './field-name.definer';
import { Field$name } from './field.impl';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Builds a component property decorator that {@link FieldShare shares} a form field control.
 *
 * @typeParam TValue - Input value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field definition.
 * @param define - Field property definition builders.
 *
 * @return Component property decorator.
 */
export function Field<TValue = any, TClass extends ComponentClass = Class>(
    def: FieldDef<TValue> = {},
    ...define: Field.Definer<TValue, TClass>[]
): ComponentShareDecorator<Field<TValue>, TClass> {

  const { share = FieldShare, formShare: formShareRef = FormShare, name } = def;
  const formShare: FormShare = formShareRef[ComponentShare__symbol]();
  const definers: Field.Definer<TValue, TClass>[] = [FieldName({ name }), ...define];

  return Shared(
      share,
      ...definers.map(definer => (
          descriptor: Shared.Descriptor<Field<TValue>, TClass>,
      ) => definer({ ...descriptor, formShare, name: Field$name(descriptor.key, name) })),
  );
}

/**
 * Form field definition.
 *
 * @typeParam TValue - Input value type.
 */
export interface FieldDef<TValue = any> {

  readonly formShare?: ComponentShareRef<Form>;

  readonly share?: ComponentShareRef<InControl<TValue>>;

  readonly name?: string;

}

export type Field<TValue> = InControl<TValue>;

export namespace Field {

  export interface Descriptor<TValue = any, TClass extends ComponentClass = Class>
      extends Shared.Descriptor<Field<TValue>, TClass> {

    readonly formShare: FormShare;

    readonly name: string | null;

  }

  export type Definer<TValue = any, TClass extends ComponentClass = Class> =
      (
          this: void,
          descriptor: Descriptor<TValue, TClass>,
      ) => Definition<TValue, TClass> | void;

  export type Definition<TValue = any, TClass extends ComponentClass = Class> =
      Shared.Definition<Field<TValue>, TClass>;

}
