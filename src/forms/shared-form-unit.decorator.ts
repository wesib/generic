import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { ComponentShareDecorator, ComponentShareLocator, ComponentShareRef, Shared } from '../share';
import { Form } from './form';
import { FormUnit } from './form-unit';

/**
 * Builds a decorator of component property that shares a form unit.
 *
 * @typeParam TUnit - Unit type.
 * @typeParam TValue - Unit value type.
 * @typeParam TControls - Unit controls type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Unit share reference.
 * @param define - Unit property definition builders.
 *
 * @return Component property decorator.
 */
export function SharedFormUnit<
    TUnit extends FormUnit<TValue, TControls>,
    TValue = FormUnit.ValueType<TUnit>,
    TControls extends FormUnit.Controls<TValue> = FormUnit.ControlsType<TUnit>,
    TClass extends ComponentClass = Class>(
    share: ComponentShareRef<TUnit>,
    ...define: SharedFormUnit.Definer<TUnit, TValue, TControls, TClass>[]
): ComponentShareDecorator<TUnit, TClass> {
  return Shared(share, ...define);
}

export namespace SharedFormUnit {

  /**
   * A descriptor of the component property that shares a form unit.
   *
   * Passed to {@link Definer property definer} by {@link SharedFormUnit @SharedFormUnit} decorator to build a
   * {@link Definition property definition}.
   *
   * @typeParam TValue - Unit value type.
   * @typeParam TControls - Unit controls type.
   * @typeParam TClass - A type of decorated component class.
   */
  export interface Descriptor<
      TUnit extends FormUnit<TValue, TControls>,
      TValue = FormUnit.ValueType<TUnit>,
      TControls extends FormUnit.Controls<TValue> = FormUnit.ControlsType<TUnit>,
      TClass extends ComponentClass = Class>
      extends Shared.Descriptor<TUnit, TClass> {

    /**
     * Predefined share locator of the form to add the unit to, or `undefined` when unknown.
     */
    readonly locateForm?: ComponentShareLocator<Form<any, any>>;

    /**
     * Predefined unit name, or `null`/`undefined` when the unit is not to be added to the {@link locateForm form}.
     */
    readonly name?: string | null;

  }

  /**
   * A signature of definition builder of the component property that shares a form unit.
   *
   * This is a function called by {@link SharedFormUnit @SharedFormUnit} decorator to apply additional definitions.
   *
   * @typeParam TUnit - Unit type.
   * @typeParam TValue - Unit value type.
   * @typeParam TControls - Unit controls type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definer<
      TUnit extends FormUnit<TValue, TControls>,
      TValue = FormUnit.ValueType<TUnit>,
      TControls extends FormUnit.Controls<TValue> = FormUnit.ControlsType<TUnit>,
      TClass extends ComponentClass = Class> =
  /**
   * @param descriptor - Decorated component property descriptor.
   *
   * @returns Component property definition, or nothing if the property definition is not to be changed.
   */
      (
          this: void,
          descriptor: Descriptor<TUnit, TValue, TControls, TClass>,
      ) => Definition<TUnit, TValue, TControls, TClass> | void;

  /**
   * A definition of component property that shares a form unit.
   *
   * @typeParam TUnit - Unit type.
   * @typeParam TValue - Unit value type.
   * @typeParam TControls - Unit controls type.
   * @typeParam TClass - A type of decorated component class.
   */
  export type Definition<
      TUnit extends FormUnit<TValue, TControls>,
      TValue = FormUnit.ValueType<TUnit>,
      TControls extends FormUnit.Controls<TValue> = FormUnit.ControlsType<TUnit>,
      TClass extends ComponentClass = Class> =
      Shared.Definition<TUnit, TClass>;

}
