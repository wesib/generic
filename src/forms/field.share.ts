import { InControl } from '@frontmeans/input-aspects';
import { ComponentShare, ComponentShare__symbol } from '../share';

let FieldShare$instance: FieldShare | undefined;

export class FieldShare<T = any> extends ComponentShare<InControl<T>> {

  static [ComponentShare__symbol](): FieldShare {
    return FieldShare$instance || (FieldShare$instance = new FieldShare('field'));
  }

}
