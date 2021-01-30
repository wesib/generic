import { InControl } from '@frontmeans/input-aspects';
import { ComponentShare, ComponentShare__symbol } from '../share';

let FormControlShare$instance: FormControlShare | undefined;

export class FormControlShare<T = any> extends ComponentShare<InControl<T>> {

  static [ComponentShare__symbol](): FormControlShare {
    return FormControlShare$instance || (FormControlShare$instance = new FormControlShare('form-control'));
  }

}
