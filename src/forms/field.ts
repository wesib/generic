import { InControl } from '@frontmeans/input-aspects';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare, ComponentShareDecorator, Shared } from '../share';
import { FieldShare } from './field.share';

/**
 * Builds a component property decorator that {@link FieldShare shares} a form field control.
 *
 * @typeParam TValue - Input value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field definition.
 */
export function Field<TValue = any, TClass extends ComponentClass = Class>(
    def: FieldDef<TValue> = {},
): ComponentShareDecorator<InControl<TValue>, TClass> {

  const { share = FieldShare } = def;

  return Shared(share);
}

/**
 * Form field definition.
 *
 * @typeParam TValue - Input value type.
 */
export interface FieldDef<TValue = any> {

  readonly share?: ComponentShare<InControl<TValue>>;

}
