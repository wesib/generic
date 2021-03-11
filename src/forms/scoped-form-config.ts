import { InControl } from '@frontmeans/input-aspects';
import { Supply, SupplyPeer } from '@proc7ts/supply';
import { FormScope } from './form-scope';

/**
 * Scoped form setup configuration.
 *
 * Contains setup options along with the scope they applicable to.
 *
 * May be one of:
 *
 * - `false` - to not apply configuration,
 * - `true` - to apply default configuration to every control,
 * - role name or array of role names - to apply default configuration only to controls with that roles,
 * - `null`, `undefined`, or empty array - to apply default configuration only to controls with default role,
 * - an array containing options as the first element, and role names as the rest of them - to apply these options
 *   only to controls with that roles,
 * - a tuple consisting of options and {@link FormScope scope} specifier - to apply these options to specified scope.
 *
 * @typeParam TOptions - A type of setup options.
 */
export type ScopedFormConfig<TOptions> =
    | TOptions
    | FormScope
    | readonly [TOptions, FormScope?]
    | readonly [TOptions, ...string[]];

export const ScopedFormConfig = {

  /**
   * Creates an input control setup procedure that applies the given configuration to appropriate scope.
   *
   * @typeParam TOptions - A type of setup options.
   * @typeParam TControl - Input control type.
   * @typeParam TValue - Input value type.
   * @param config - Scoped form setup configuration.
   * @param createSetup - A function accepting setup options and returning a procedure that sets up the given control
   * with these options. The setup procedure returns a setup supply peer. The setup should be reverted once this peer's
   * supply cut off.
   * @param defaultRole - A role name to apply by default. `'default'` when omitted.
   *
   * @returns A setup procedure accepting target control as parameter and returning a setup supply. The setup is
   * reverted once this supply cut off.
   */
  createSetup<
      TOptions,
      TControl extends InControl<TValue>,
      TValue = InControl.ValueType<TControl>,
      >(
      config: ScopedFormConfig<TOptions>,
      createSetup: (this: void, options?: TOptions) => (this: void, control: TControl) => SupplyPeer,
      defaultRole?: string,
  ): (this: void, control: TControl) => Supply {

    let scope: FormScope;
    let options: TOptions | undefined;

    if (Array.isArray(config)) {

      const [first, ...rest] = config;

      if (ScopedFormConfig$isOptions(first)) {
        scope = rest.length > 1 ? rest : rest[0];
        options = first;
      } else {
        scope = config;
      }
    } else if (ScopedFormConfig$isOptions(config)) {
      options = config as TOptions;
    } else {
      scope = config;
    }

    return FormScope.createSetup<TControl, TValue>(
        scope,
        createSetup(options),
        defaultRole,
    );
  },

};

function ScopedFormConfig$isOptions<TOptions>(
    config: TOptions | string | boolean | undefined,
): config is TOptions {
  return config != null && typeof config !== 'string' && typeof config !== 'boolean';
}
