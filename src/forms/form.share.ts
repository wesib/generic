import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ContextKey__symbol } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/primitives';
import { DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol, SharedByComponent } from '../share';
import { FieldShare } from './field.share';
import { Form } from './form';

let FormShare$instance: FormShare | undefined;

export class FormShare<TModel = any, TElt extends HTMLElement = HTMLElement>
    extends ComponentShare<Form<TModel, TElt>> {

  static [ComponentShare__symbol](): FormShare<any, any> {
    return FormShare$instance || (FormShare$instance = new FormShare('form'));
  }

  static get [ContextKey__symbol](): ComponentShare.Key<Form> {
    return this[ComponentShare__symbol]()[ContextKey__symbol];
  }

  addSharer(defContext: DefinitionContext, name?: QualifiedName): Supply {

    const formControlShare = FieldShare[ComponentShare__symbol]();
    const supply = super.addSharer(defContext, name);

    formControlShare.addSharer(defContext, name).as(supply);

    return supply;
  }

  shareValue(registrar: SharedByComponent.Registrar<Form<TModel, TElt>>): void {
    super.shareValue(registrar);

    const fieldShare = FieldShare[ComponentShare__symbol]();

    fieldShare.shareValue(registrar.withPriority(registrar.priority + 1));
  }

}
