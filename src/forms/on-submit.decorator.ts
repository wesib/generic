import { handleDomEvents } from '@frontmeans/dom-events';
import { consumeEvents } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import { ComponentClass, ComponentContext, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { shareLocator, ShareLocator } from '../shares';
import { Form } from './form';
import { FormShare } from './form.share';

/**
 * Creates a decorator for component method to call on input form submit.
 *
 * The decorated method accepts a {@link Form.Whole whole form} about to be submitted, and a submit event as parameters.
 *
 * @typeParam TModel - Submitted model type.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Submit handler definition.
 *
 * @returns New component property decorator.
 */
export function OnSubmit<TModel = any, TElt extends HTMLElement = HTMLElement, T extends ComponentClass = Class>(
    def: OnSubmitDef<TModel, TElt> = {},
): ComponentPropertyDecorator<(form: Form.Whole<TModel, TElt, InstanceType<T>>, event: Event) => void, T> {

  const { form: formRef = FormShare, cancel = true } = def;
  const locateForm = shareLocator(formRef, { share: FormShare, local: 'too' });

  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenConnected(() => {

            const { component } = context;

            locateForm(context).do(
                consumeEvents((form?: Form<TModel, TElt>, _sharer?: ComponentContext) => {

                  const ready = form?.asWhole();

                  if (!ready) {
                    return;
                  }

                  let onSubmit = ready.element.events.on('submit');

                  if (cancel) {
                    onSubmit = onSubmit.do(
                        handleDomEvents(false),
                    );
                  }

                  return onSubmit(
                      event => get(component).call(component, ready, event),
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
