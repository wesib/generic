import {
  InAspect,
  InAspect__symbol,
  InBuilder,
  InControl,
  InConverter,
  inconvertibleInAspect,
  inFormElement,
  InFormElement,
  nullInAspect,
} from '@frontmeans/input-aspects';
import { AfterEvent, afterValue, deduplicateAfter_, digAfter_, mapAfter } from '@proc7ts/fun-events';
import { lazyValue, valueRecipe } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { Shareable } from '../shares';
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
    extends FormUnit<TModel, Form.Body<TModel, TElt>, TSharer> {

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

  /**
   * Creates a form instance by the given control factories.
   *
   * @param factory - Submittable form control factory.
   * @param elementFactory - Form element control factory or options.
   *
   * @returns New form instance.
   */
  static by<
      TModel,
      TElt extends HTMLElement = HTMLElement,
      TSharer extends object = any>(
      factory: InControl.Factory<InControl<TModel>, TModel>,
      elementFactory: (
          this: void,
          options: Parameters<InControl.Factory<InFormElement<TElt>, void>>[0] & { form: InControl<TModel>},
      ) => InFormElement<TElt>,
  ): Form<TModel, TElt, TSharer> {
    return new this(this.providerBy(factory, elementFactory));
  }

  /**
   * Creates a form controls provider by the given control factories.
   *
   * @param factory - Submittable form control factory.
   * @param elementFactory - Form element control factory or options.
   *
   * @returns New form controls provider.
   */
  static providerBy<
      TModel,
      TElt extends HTMLElement = HTMLElement,
      TSharer extends object = any>(
      factory: InControl.Factory<InControl<TModel>, TModel>,
      elementFactory: (
          this: void,
          options: Parameters<InControl.Factory<InFormElement<TElt>, void>>[0] & { form: InControl<TModel>},
      ) => InFormElement<TElt>,
  ): Form.Provider<TModel, TElt, TSharer> {
    return builder => {

      let control = (): InControl<TModel> => builder.control.build(
          // Allow recurrent access to `Form` aspect during control setup.
          opts => (control = lazyValue(() => factory(opts)))(),
      );
      let element = (): InFormElement<TElt> => builder.element.build(
          // Allow recurrent access to `Form` aspect during control setup.
          opts => (element = lazyValue(() => elementFactory({
            form: control(),
            ...opts,
          })))(),
      );

      return {
        get control() {
          return control();
        },
        get element() {
          return element();
        },
      };
    };
  }

  /**
   * An input control aspect representing a form this control belongs to.
   *
   * This aspect is available in {@link Form.Body.control submittable form control} and {@link Form.Body.element form
   * element control}.
   */
  static get [InAspect__symbol](): InAspect<Form.Whole | null> {
    return Form__aspect;
  }

  /**
   * Constructs form.
   *
   * @param controls - Either form controls instance, or its provider.
   */
  constructor(
      controls: Form.Controls<TModel, TElt> | Form.Provider<TModel, TElt, TSharer>,
  ) {
    super(Form$provider(() => this, valueRecipe(controls)));
  }

  /**
   * Form element control, if present.
   *
   * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
   * element issuing a `submit` event.
   */
  get element(): InFormElement<TElt> | undefined {
    return this.body?.element;
  }

  toString(): string {
    return 'Form';
  }

}

function Form$provider<TModel, TElt extends HTMLElement, TSharer extends object>(
    form: () => Form<TModel, TElt, TSharer>,
    provider: Form.Provider<TModel, TElt, TSharer>,
): Shareable.Provider<Form.Body<TModel, TElt> | undefined, TSharer> {

  const formAspect: InConverter.Aspect.Factory<any> = control => ({
    applyAspect<TInstance, TKind extends InAspect.Application.Kind>(
        _aspect: InAspect<any, any>,
    ): InAspect.Application.Result<TInstance, any, TKind> | undefined {
      return inconvertibleInAspect(
          control,
          Form,
          form() as Form.Whole,
      ) as InAspect.Application.Result<TInstance, any, TKind>;
    },
  });

  return sharer => sharer.get(FormPreset).rules.do(
      digAfter_(preset => {

        const builder: Form.Builder<TModel, TElt, TSharer> = {
          sharer,
          form: form(),
          control: new InBuilder<InControl<TModel>, TModel>().addAspect(Form, formAspect),
          element: new InBuilder<InFormElement<TElt>, void>().addAspect(Form, formAspect),
        };

        preset.setupForm(builder);

        return afterValue(provider(builder));
      }),
      deduplicateAfter_(Form$isDuplicateControls, ([controls]) => controls),
      mapAfter(controls => controls && {
        get form() {
          return form();
        },
        get control() {
          return controls!.control;
        },
        get element() {
          return controls!.element;
        },
      }),
  );
}

function Form$isDuplicateControls<TModel, TElt extends HTMLElement>(
    prior: Form.Controls<TModel, TElt> | undefined,
    next: Form.Controls<TModel, TElt> | undefined,
): boolean {

  let duplicate = true;

  if (prior?.control !== next?.control) {
    prior?.control.supply.off();
    duplicate = false;
  }
  if (prior?.element !== next?.element) {
    prior?.element.supply.off();
    duplicate = false;
  }

  return duplicate;
}

export namespace Form {

  /**
   * A whole form instance containing controls.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export interface Whole<
      TModel = any,
      TElt extends HTMLElement = HTMLElement,
      TSharer extends object = any>
      extends Form<TModel, TElt, TSharer>, Form.Body<TModel, TElt> {

    /**
     * Submittable form input control.
     */
    readonly control: InControl<TModel>;

    /**
     * Form element control.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InFormElement<any>;

  }

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
  export interface Controls<TModel, TElt extends HTMLElement = HTMLElement> extends FormUnit.Controls<TModel> {

    /**
     * Submittable form input control.
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
   * Form body containing input controls.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export interface Body<
      TModel,
      TElt extends HTMLElement = HTMLElement,
      TSharer extends object = any,
      > extends Controls<TModel, TElt> {

    /**
     * Submittable form input control.
     */
    readonly control: InControl<TModel>;

    /**
     * Form element control.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InFormElement<TElt>;

    /**
     * A form the controls belong to.
     */
    readonly form: Form<TModel, TElt, TSharer>;

  }

  /**
   * Form builder.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Builder<TModel, TElt extends HTMLElement, TSharer extends object> {

    /**
     * Sharer component context.
     */
    readonly sharer: ComponentContext<TSharer>;

    /**
     * Target form.
     */
    readonly form: Form<TModel, TElt, TSharer>;

    /**
     * Submittable form control builder.
     */
    readonly control: InBuilder<InControl<TModel>, TModel>;

    /**
     * Form element control builder.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InBuilder<InFormElement<TElt>, void>;

  }

  /**
   * Form controls provider signature.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export type Provider<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = object> =
  /**
   * @param builder - Form builder.
   *
   * @returns Either form controls instance, or an `AfterEvent` keeper reporting one.
   */
      (
          this: void,
          builder: Builder<TModel, TElt, TSharer>,
      ) => Controls<TModel, TElt> | AfterEvent<[Controls<TModel, TElt>?]>;

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
type Form$Applied<TValue> = InAspect.Applied<TValue, Form.Whole<TValue> | null, Form.Whole<any> | null>;

declare module '@frontmeans/input-aspects' {

  export namespace InAspect.Application {

    export interface Map<TInstance, TValue> {

      /**
       * Form aspect application type.
       */
      form(): Form.Whole<TValue> | null;

    }

  }

}
