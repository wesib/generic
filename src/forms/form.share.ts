import { ContextKey__symbol } from '@proc7ts/context-values';
import { arrayOfElements, Supply } from '@proc7ts/primitives';
import { DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol, ComponentShareRef, SharedByComponent } from '../shares';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';

const FormShare$asFields = (/*#__PURE__*/ Symbol('FormShare.asFields'));

let FormShare$instance: FormShare | undefined;

/**
 * A kind of component share containing a user input form.
 *
 * This class may be inherited to represent a specific type of forms. E.g. to support multiple forms within the same
 * component tree.
 *
 * Shares a form as a {@link FieldShare field}.
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
   * A key of component context value containing default form instance.
   */
  static get [ContextKey__symbol](): ComponentShare.Key<Form> {
    return this[ComponentShare__symbol][ContextKey__symbol];
  }

  /**
   * @internal
   */
  private readonly [FormShare$asFields]: readonly ComponentShare<Field<TModel>>[];

  /**
   * Constructs form share.
   *
   * @param name - A human-readable name of the form share.
   * @param options - Constructed form share options.
   */
  constructor(
      name: string,
      options: FormShare.Options<TModel, TElt> = {},
  ) {
    super(name, options);
    this[FormShare$asFields] = options.asField
        ? arrayOfElements<ComponentShareRef<Field<TModel>>>(options.asField).map(ref => ref[ComponentShare__symbol])
        : [FieldShare[ComponentShare__symbol]];
  }

  addSharer(defContext: DefinitionContext, options?: SharedByComponent.Options): Supply {

    const supply = super.addSharer(defContext, options);

    this.addFieldSharer(defContext, options).as(supply);

    return supply;
  }

  /**
   * Registers a field sharer component.
   *
   * By default, registers a sharer for each {@link FormShare.Options.asField aliased field share}.
   *
   * This method is called from {@link addSharer} one.
   *
   * @param defContext - The definition context of the sharer component.
   * @param options - Value sharing options.
   *
   * @returns Sharer registration supply. Revokes the sharer registration once cut off.
   */
  addFieldSharer(defContext: DefinitionContext, options?: SharedByComponent.Options): Supply {

    const supply = new Supply();

    this[FormShare$asFields].forEach(fieldShare => fieldShare.addSharer(defContext, options).as(supply));

    return supply;
  }

  shareValue(registrar: SharedByComponent.Registrar<Form<TModel, TElt>>): void {
    super.shareValue(registrar);
    this.shareField(registrar.withPriority(registrar.priority + 1));
  }

  /**
   * Shares a field value by providing it for the sharer component context.
   *
   * By default, shares a form as a field instance for each {@link FormShare.Options.asField aliased field share}.
   *
   * This method is called from {@link shareValue} one.
   *
   * @param registrar - Shared value registrar.
   *
   * @return A builder of shared value for component context.
   */
  shareField(registrar: SharedByComponent.Registrar<Field<TModel>>): void {
    this[FormShare$asFields].forEach(fieldShare => fieldShare.shareValue(registrar));
  }

}

export namespace FormShare {

  /**
   * {@link FieldShare Field share} options.
   *
   * @typeParam TModel - A model type of the form.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Options<TModel, TElt extends HTMLElement> extends ComponentShare.Options<Form<TModel, TElt>> {

    /**
     * Field share reference(s) the share provides instances for in addition to the form instance.
     *
     * The order of aliases is important. It defines the {@link SharedByComponent.Details.priority priority} of the
     * value shared for the corresponding share.
     *
     * A {@link FieldShare default field share} is used when omitted.
     */
    readonly asField?: ComponentShareRef<Field<TModel>> | ComponentShareRef<Field<TModel>>[];

  }

}
