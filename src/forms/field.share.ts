import { ComponentShare, ComponentShare__symbol } from '../share';
import { Field } from './field';

let FieldShare$instance: FieldShare | undefined;

export class FieldShare<TValue = any> extends ComponentShare<Field<TValue>> {

  static [ComponentShare__symbol](): FieldShare {
    return FieldShare$instance || (FieldShare$instance = new FieldShare('field'));
  }

}
