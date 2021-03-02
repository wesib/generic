import { ContextKey__symbol } from '@proc7ts/context-values';
import { Class } from '@proc7ts/primitives';
import { Share, Share__symbol } from '../shares';
import { Form } from './form';

const FormShare$map = (/*#__PURE__*/ new WeakMap<Class, FormShare<any, any>>());

/**
 * A kind of component share containing a user input form.
 *
 * This class may be inherited to represent a specific type of forms. E.g. to support multiple forms within the same
 * component tree.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 */
export class FormShare<TModel = any, TElt extends HTMLElement = HTMLElement> extends Share<Form<TModel, TElt>> {

  /**
   * Default form share instance.
   */
  static get [Share__symbol](): FormShare<any, any> {

    let instance = FormShare$map.get(this);

    if (!instance) {
      instance = new this('field');
      FormShare$map.set(this, instance);
    }

    return instance;
  }

  /**
   * A key of component context value containing default form instance.
   */
  static get [ContextKey__symbol](): Share.Key<Form> {
    return this[Share__symbol][ContextKey__symbol];
  }

}
