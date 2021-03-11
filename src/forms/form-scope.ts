import { InControl, InRole } from '@frontmeans/input-aspects';
import { arrayOfElements } from '@proc7ts/primitives';
import { neverSupply, Supply, SupplyPeer } from '@proc7ts/supply';

/**
 * A scope of form setup applicability.
 *
 * Selects controls to set up:
 *
 * - `false` - to set up nothing,
 * - `true` - to set up every control,
 * - role name or array of role names - to set up only to controls with that roles,
 * - `null`, `undefined`, or empty array - to set up only controls with default role.
 */
export type FormScope =
    | boolean
    | string
    | readonly string[]
    | null
    | undefined;

export const FormScope = {

  /**
   * Creates an input control setup procedure applied to the given scope.
   *
   * @typeParam TControl - Input control type.
   * @typeParam TValue - Input value type.
   * @param scope - Setup applicability scope.
   * @param setup - A setup procedure to apply. Accepts target control instance as parameter and returns a setup supply
   * peer. The setup should be reverted once this peer's supply cut off.
   * @param defaultRole - A role name to apply by default. `'default'` when omitted.
   *
   * @returns A setup procedure accepting target control as parameter and returning a setup supply. The setup is
   * reverted once this supply cut off.
   */
  createSetup<TControl extends InControl<TValue>, TValue = InControl.ValueType<TControl>>(
      this: void,
      scope: FormScope,
      setup: (this: void, control: TControl) => SupplyPeer,
      defaultRole = 'default',
  ): (this: void, control: TControl) => Supply {
    if (scope === false) {
      return _control => neverSupply();
    }
    if (scope === true) {
      return control => setup(control).supply;
    }

    let roles = arrayOfElements(scope);

    if (!roles.length) {
      roles = [defaultRole];
    }

    if (roles.length === 1) {
      return control => control.aspect(InRole).when(roles[0], () => setup(control));
    }

    return control => roles.reduce(
        (supply, role) => control.aspect(InRole).when(role, () => setup(control)).as(supply),
        new Supply(),
    );
  },

};
