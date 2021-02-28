import { ContextKey__symbol } from '@proc7ts/context-values';
import { Class } from '@proc7ts/primitives';
import { Share, Share__symbol } from '../shares';
import { Field } from './field';

const FieldShare$map = (/*#__PURE__*/ new WeakMap<Class, FieldShare<any>>());

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

    let instance = FieldShare$map.get(this);

    if (!instance) {
      instance = new this('field');
      FieldShare$map.set(this, instance);
    }

    return instance;
  }

  /**
   * A key of component context value containing default field instance.
   */
  static get [ContextKey__symbol](): Share.Key<Field<any>> {
    return this[Share__symbol][ContextKey__symbol];
  }

}
