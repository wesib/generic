import { Class } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { AeShared, SharedDef, ShareLocator } from '../shares';
import { FormUnit } from './form-unit';

/**
 * An amended entity representing a component member containing a shared from unit to amend.
 *
 * @typeParam TUnit - Unit type.
 * @typeParam TMemberValue - Amended member value type.
 * @typeParam TUnitValue - Unit value type.
 * @typeParam TControls - Unit controls type.
 * @typeParam TClass - Amended component class type.
 */
export interface AeSharedFormUnit<
    TUnit extends FormUnit<TUnitValue, TControls>,
    TMemberValue extends SharedDef.Value<TUnit> = SharedDef.Value<TUnit>,
    TUnitValue = FormUnit.ValueType<TUnit>,
    TControls extends FormUnit.Controls<TUnitValue> = FormUnit.ControlsType<TUnit>,
    TClass extends ComponentClass = Class>
    extends AeShared<TUnit, TMemberValue, TClass> {

  /**
   * Predefined locator function of the form unit to add the share unit to, or `undefined` when unknown.
   */
  readonly locateForm?: ShareLocator.Fn<FormUnit<any>>;

  /**
   * Predefined unit name, or `null`/`undefined` when the unit is not to be added to the {@link locateForm form}.
   */
  readonly name?: string | null;

}
