import { ContextKey__symbol } from '@proc7ts/context-values';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol } from '../share';
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
export class FieldShare<TValue = any> extends ComponentShare<Field<TValue>> {

  /**
   * Default field share instance.
   */
  static get [ComponentShare__symbol](): FieldShare {
    return FieldShare$instance || (FieldShare$instance = new FieldShare('field'));
  }

  /**
   * A key of component context value containing default field instance.
   */
  static get [ContextKey__symbol](): ComponentShare.Key<Field<any>> {
    return this[ComponentShare__symbol][ContextKey__symbol];
  }

  bindValue(value: Field<TValue>, sharer: ComponentContext): Field<TValue> {
    return value.shareBy(sharer);
  }

}
