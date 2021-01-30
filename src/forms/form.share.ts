import { InControl } from '@frontmeans/input-aspects';
import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ContextBuilder, ContextBuilder__symbol } from '@proc7ts/context-values';
import { AfterEvent, AfterEvent__symbol, EventKeeper, isEventKeeper, translateAfter } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { ComponentContext, DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol } from '../share';
import { Form } from './form';
import { FormControlShare } from './form-control.share';

let FormShare$instance: FormShare | undefined;

export class FormShare<TModel = any, TElt extends HTMLElement = HTMLElement>
    extends ComponentShare<Form<TModel, TElt>> {

  static [ComponentShare__symbol](): FormShare<any, any> {
    return FormShare$instance || (FormShare$instance = new FormShare('form'));
  }

  addSharer(defContext: DefinitionContext, name?: QualifiedName): Supply {

    const formControlShare = FormControlShare[ComponentShare__symbol]();
    const supply = super.addSharer(defContext, name);

    formControlShare
        .addSharer(defContext, name)
        .needs(supply)
        .cuts(supply);

    return supply;
  }

  shareValue<TComponent extends object>(
      provider: (this: void, context: ComponentContext<TComponent>) =>
          | EventKeeper<[Form<TModel, TElt>] | []>
          | Form<TModel, TElt>,
  ): ContextBuilder<ComponentContext<TComponent>> {

    const builder = super.shareValue(provider);
    const formControlShare = FormControlShare[ComponentShare__symbol]();
    const controlBuilder = formControlShare.shareValue<TComponent>(
        (
            context: ComponentContext<TComponent>,
        ): InControl<TModel> | AfterEvent<[InControl<TModel>] | []> => {

          const shared = provider(context);

          if (isEventKeeper(shared)) {
            return shared[AfterEvent__symbol]().do(
                translateAfter((send, form?) => form ? send(form.control) : send()),
            );
          }

          return shared.control;
        },
        1,
    );

    return {
      [ContextBuilder__symbol](registry) {

        const supply = builder[ContextBuilder__symbol](registry);

        controlBuilder[ContextBuilder__symbol](registry).needs(supply).cuts(supply);

        return supply;
      },
    };
  }

}
