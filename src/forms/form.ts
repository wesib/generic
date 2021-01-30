import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShareDecorator, ComponentShareRef, Shared } from '../share';
import { FormControl } from './form-control';
import { FormShare } from './form-share';

export function Form<TModel = any, TClass extends ComponentClass = Class>(
    def?: FormDef<TModel>,
): ComponentShareDecorator<Form<TModel>, TClass> {

  const { share = FormShare } = def;

  return Shared(share);
}

export interface Form<TModel = any> extends FormControl<TModel> {

}

export interface FormDef<TModel = any> {

  readonly share?: ComponentShareRef<Form<TModel>>;

}
