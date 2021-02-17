import {
  InAspect,
  InAspect__symbol,
  InControl,
  InConverter,
  inconvertibleInAspect,
  inFormElement,
  InFormElement,
  nullInAspect,
} from '@frontmeans/input-aspects';
import { AfterEvent, digAfter, mapAfter } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShareable } from '../share';
import { Field } from './field';
import { FormPreset } from './form-preset';
import { FormUnit } from './form-unit';

const Form__aspect: Form$Aspect = {

  applyTo<TValue>(_control: InControl<TValue>): Form$Applied<TValue> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return nullInAspect();
  },

};

/**
 * User input form.
 *
 * A component {@link FormShare shares} form (e.g. using {@link SharedForm @SharedForm} decorator) to make its
 * accessible by component itself and nested ones. E.g. to add {@link Field fields} to it or submit it.
 *
 * A form may be nested within another one, as it implements a {@link Field} interface.
 *
 * The form instance is not usable until it is bound to its sharer component. The latter is done automatically when the
 * form is shared by {@link FormShare}.
 *
 * @typeParam TModel - A model type of the form, i.e. a type of its control value.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TSharer - Form sharer component type.
 */
export class Form<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = any>
    extends FormUnit<TModel, Form.Controls<TModel, TElt>, TSharer>
    implements Form.Controls<TModel, TElt> {

  /**
   * Builds a user input form for the given form control and HTML element.
   *
   * @param control - Submitted control. Typically a container one.
   * @param element - HTML element to create control for.
   * @param options - Form element control options.
   *
   * @returns New form instance.
   */
  static forElement<TModel, TElt extends HTMLElement>(
      control: InControl<TModel>,
      element: TElt,
      options?: Omit<InFormElement.Options, 'form'>,
  ): Form.Controls<TModel, TElt> {
    return {
      control,
      element: inFormElement(element, { ...options, form: control }),
    };
  }

  static get [InAspect__symbol](): InAspect<Form | null> {
    return Form__aspect;
  }

  constructor(
      controls: Form.Controls<TModel, TElt> | Form.Provider<TModel, TElt, TSharer>,
  ) {
    super(Form$provider(() => this, controls));
  }

  /**
   * Form element control.
   *
   * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
   * element issuing a `submit` event.
   */
  get element(): InFormElement<TElt> {
    return this.internals.element;
  }

  toString(): string {
    return 'Form';
  }

}

function Form$provider<TModel, TElt extends HTMLElement, TSharer extends object>(
    form: () => Form<TModel, TElt, TSharer>,
    controls: Form.Controls<TModel, TElt> | Form.Provider<TModel, TElt, TSharer>,
): Form.Provider<TModel, TElt, TSharer> {

  const formAspects: InConverter.Aspect.Factory<any> = control => ({
    applyAspect<TInstance, TKind extends InAspect.Application.Kind>(
        aspect: InAspect<any, any>,
    ): InAspect.Application.Result<TInstance, any, TKind> | undefined {
      if (aspect === Form__aspect) {
        return inconvertibleInAspect(control, Form, form()) as InAspect.Application.Result<TInstance, any, TKind>;
      }
      return;
    },
  });
  const provider = ComponentShareable.provider(controls);
  const createControls = (
      sharer: ComponentContext<TSharer>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> => provider(sharer).do(
      mapAfter(({ control, element }) => {
        control.addAspect(formAspects);
        element.addAspect(formAspects);
        return { control, element };
      }),
  );

  return sharer => sharer.get(FormPreset).rules.do(
      digAfter(preset => preset.setupForm(createControls(sharer), form())),
  );
}

export namespace Form {

  /**
   * A model type of the given form.
   *
   * @typeParam TForm - Form type.
   */
  export type ModelType<TForm extends Form<any, any>> = FormUnit.ValueType<TForm>;

  /**
   * HTML form element type of the form.
   *
   * @typeParam TForm - Form type.
   */
  export type ElementType<TForm extends Form<any, any>> = TForm extends Form<any, infer TElt> ? TElt : never;

  /**
   * Form controls.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Controls<TModel, TElt extends HTMLElement = HTMLElement> extends Field.Controls<TModel> {

    /**
     * Submittable form input control.
     *
     * @typeParam TModel - A model type of the form, i.e. a type of its control value.
     * @typeParam TElt - A type of HTML form element.
     */
    readonly control: InControl<TModel>;

    /**
     * Form element control.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InFormElement<TElt>;

  }

  /**
   * Form controls provider signature.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export type Provider<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = object> =
      ComponentShareable.Provider<Controls<TModel, TElt>, TSharer>;

}

/**
 * Form aspect.
 */
interface Form$Aspect extends InAspect<Form | null, 'form'> {

  applyTo<TValue>(control: InControl<TValue>): Form$Applied<TValue>;

}

/**
 * A form aspect applied to control.
 */
type Form$Applied<TValue> = InAspect.Applied<TValue, Form<TValue> | null, Form<any> | null>;

declare module '@frontmeans/input-aspects' {

  export namespace InAspect.Application {

    export interface Map<TInstance, TValue> {

      /**
       * Form aspect application type.
       */
      form(): Form<TValue> | null;

    }

  }

}
