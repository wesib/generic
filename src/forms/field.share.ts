import { ContextKey__symbol } from '@proc7ts/context-values';
import { ComponentShare, ComponentShare__symbol } from '../share';
import { Field } from './field';

let FieldShare$instance: FieldShare | undefined;

export class FieldShare<TValue = any> extends ComponentShare<Field<TValue>> {

  static get [ComponentShare__symbol](): FieldShare {
    return FieldShare$instance || (FieldShare$instance = new FieldShare('field'));
  }

  static get [ContextKey__symbol](): ComponentShare.Key<Field<any>> {
    return this[ComponentShare__symbol][ContextKey__symbol];
  }


}
