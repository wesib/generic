import { InControl } from '@frontmeans/input-aspects';
import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShare, ComponentShareDecorator, Shared } from '../share';
import { FormControlShare } from './form-control.share';

/**
 * Builds a component property decorator that {@link FormControlShare shares} a form control.
 *
 * @typeParam TValue - Input value type.
 * @typePAram TClass - A type of decorated component class.
 * @param def - Form control definition.
 */
export function FormControl<TValue = any, TClass extends ComponentClass = Class>(
    def: FormControlDef<TValue> = {},
): ComponentShareDecorator<InControl<TValue>, TClass> {

  const { share = FormControlShare } = def;

  return Shared(share);
}

/**
 * Form control definition.
 *
 * @typeParam TValue - Input value type.
 */
export interface FormControlDef<TValue = any> {

  readonly share?: ComponentShare<InControl<TValue>>;

}
