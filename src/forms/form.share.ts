import { ContextKey__symbol } from '@proc7ts/context-values';
import { DefaultShare, Share, Share__symbol } from '../shares';
import { Form } from './form';

/**                               s
 * A kind of component share containing a user input form.
 *
 * This class may be inherited to represent a specific type of forms. E.g. to support multiple forms within the same
 * component tree.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 */
export class FormShare<TModel = any, TElt extends HTMLElement = HTMLElement> extends DefaultShare<Form<TModel, TElt>> {

  static get defaultShareName(): string {
    return 'form';
  }

  /**
   * A key of component context value containing default form instance.
   */
  static get [ContextKey__symbol](): Share.Key<Form> {
    return this[Share__symbol][ContextKey__symbol];
  }

}
