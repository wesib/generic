import { ContextKey__symbol } from '@proc7ts/context-values';
import { Share, Share__symbol } from '../shares';
import { Field } from './field';

let FieldShare$instance: FieldShare | undefined;

/**
 * A kind of component share containing a {@link Field form field}.
 *
 * This class may be inherited to represent a specific type of forms. E.g. to distinguish multiple fields defined
 * within the same component.
 *
 * @typeParam TValue - Field value type.
 */
export class FieldShare<TValue = any> extends Share<Field<TValue>> {

  /**
   * Default field share instance.
   */
  static get [Share__symbol](): FieldShare {
    return FieldShare$instance || (FieldShare$instance = new FieldShare('field'));
  }

  /**
   * A key of component context value containing default field instance.
   */
  static get [ContextKey__symbol](): Share.Key<Field<any>> {
    return this[Share__symbol][ContextKey__symbol];
  }

}
