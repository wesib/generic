import { ComponentShare, ComponentShare__symbol } from '../share';
import { FormControlShare } from './form-control-share';

let FormShare$instance: FormShare | undefined;

export class FormShare<TModel = any> extends FormControlShare<TModel> {

  static [ComponentShare__symbol](): FormShare {
    return FormShare$instance || (FormShare$instance = new FormShare('form'));
  }

  constructor(name: string, options?: ComponentShare.Options<FormControl<TModel>>) {
    super(name, options);
  }
}
