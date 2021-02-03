import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ContextKey__symbol } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/primitives';
import { DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol, SharedByComponent } from '../share';
import { FieldShare } from './field.share';
import { Form } from './form';

let FormShare$instance: FormShare | undefined;

/**
 * A kind of user input form a component shares with the nested ones.
 *
 * Nested components may utilize it e.g. to add {@link Field fields} to it.
 *
 * @typeParam TModel - A model type of the form.
 * @typeParam TElt - A type of HTML form element.
 */
export class FormShare<TModel = any, TElt extends HTMLElement = HTMLElement>
    extends ComponentShare<Form<TModel, TElt>> {

  /**
   * Default form share instance.
   */
  static get [ComponentShare__symbol](): FormShare<any, any> {
    return FormShare$instance || (FormShare$instance = new FormShare('form'));
  }

  /**
   * A key of context value containing default form instance.
   */
  static get [ContextKey__symbol](): ComponentShare.Key<Form> {
    return this[ComponentShare__symbol][ContextKey__symbol];
  }

  addSharer(defContext: DefinitionContext, name?: QualifiedName): Supply {

    const supply = super.addSharer(defContext, name);

    FieldShare[ComponentShare__symbol].addSharer(defContext, name).as(supply);

    return supply;
  }

  shareValue(registrar: SharedByComponent.Registrar<Form<TModel, TElt>>): void {
    super.shareValue(registrar);
    FieldShare[ComponentShare__symbol].shareValue(registrar.withPriority(registrar.priority + 1));
  }

}
