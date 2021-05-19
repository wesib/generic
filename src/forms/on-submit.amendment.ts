import { handleDomEvents } from '@frontmeans/dom-events';
import { consumeEvents } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import {
  AeComponentMember,
  AeComponentMemberTarget,
  ComponentClass,
  ComponentContext,
  ComponentMember,
  ComponentMemberAmendment,
} from '@wesib/wesib';
import { shareLocator, ShareLocator } from '../shares';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Creates an amendment (and decorator) of component method to call on input form submit.
 *
 * @typeParam TModel - Submitted model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended component member entity type.
 * @param def - Submit handler definition.
 *
 * @returns New component property decorator.
 */
export function OnSubmit<
    TModel = any, /* `any`, because decorators fail to infer the model */
    TElt extends HTMLElement = HTMLElement,
    TClass extends ComponentClass = Class,
    TAmended extends AeComponentMember<OnSubmitDef.Method<TModel, TElt, TClass>, TClass> =
        AeComponentMember<OnSubmitDef.Method<TModel, TElt, TClass>, TClass>>(
    def: OnSubmitDef<TModel, TElt> = {},
): ComponentMemberAmendment<
    OnSubmitDef.Method<TModel, TElt, TClass>,
    TClass,
    OnSubmitDef.Method<TModel, TElt, TClass>,
    TAmended> {

  const { form: formRef = FormShare, cancel = true } = def;
  const locateForm = shareLocator(formRef, { share: FormShare, local: 'too' });

  return ComponentMember<
      OnSubmitDef.Method<TModel, TElt, TClass>,
      TClass,
      OnSubmitDef.Method<TModel, TElt, TClass>,
      TAmended>((
      { get, amend }: AeComponentMemberTarget<OnSubmitDef.Method<TModel, TElt, TClass>, TClass>,
  ) => amend({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenConnected(() => {

            const { component } = context;

            locateForm(context).do(
                consumeEvents((form?: Form<TModel, TElt>, _sharer?: ComponentContext) => {

                  const controls = form?.body;

                  if (!controls) {
                    return;
                  }

                  let onSubmit = controls.element.events.on('submit');

                  if (cancel) {
                    onSubmit = onSubmit.do(
                        handleDomEvents(false),
                    );
                  }

                  return onSubmit(
                      event => get(component).call(component, controls, event),
                  );
                }),
            ).needs(context);
          });
        });
      },
    },
  }));
}

/**
 * Form submit handler definition.
 *
 * Configures {@link OnSubmit @OnSubmit} component property decorator.
 */
export interface OnSubmitDef<TModel = any, TElt extends HTMLElement = HTMLElement> {

  /**
   * A form to submit.
   *
   * This is a shared form locator. Includes the decorated component into the search (`{ local: 'too' }`) by default.
   *
   * A {@link FieldShare default} form share is used when omitted.
   */
  readonly form?: ShareLocator<Form<TModel, TElt>>;

  /**
   * Whether to cancel default submit handler.
   *
   * `true` by default.
   */
  readonly cancel?: boolean;

}

export namespace OnSubmitDef {

  /**
   * A signature of component method that handles form submit.
   *
   * @typeParam TModel - Submitted model type.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TClass - A type of component class.
   */
  export type Method<TModel, TElt extends HTMLElement = HTMLElement, TClass extends ComponentClass = Class> =
  /**
   * @param form - A body of the form about to be submitted.
   * @param event - A submit event.
   */
      (form: Form.Body<TModel, TElt, InstanceType<TClass>>, event: Event) => void;

}
