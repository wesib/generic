/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { InControl } from '@frontmeans/input-aspects';
import { SingleContextUpKey, SingleContextUpRef } from '@proc7ts/context-values/updatable';
import { Supply } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';

/**
 * A user input originated from control.
 *
 * It is meant to be present in root {@link HierarchyContext hierarchy context}. Nested components may access it from
 * their hierarchy contexts to participate in user input.
 *
 * An [[inputFromControl]] function can be used to initiate user input.
 *
 * @typeparam Value  Input value type.
 */
export interface InputFromControl<Value = any> {

  /**
   * Root component context the input is initiated for.
   */
  readonly root: ComponentContext;

  /**
   * User input control.
   */
  readonly control: InControl<Value>;

}

/**
 * No user input originated from control.
 */
export interface NoInputFromControl {
  control?: undefined;
}

/**
 * A key of hierarchy context value containing a user input originated from control. Potentially
 * {@link NoInputFromControl absent}.
 */
export const InputFromControl: SingleContextUpRef<InputFromControl | NoInputFromControl> = (
    /*#__PURE__*/ new SingleContextUpKey<InputFromControl | NoInputFromControl>(
        'input-from-control',
        {
          byDefault: () => ({}),
        },
    )
);

/**
 * Initiates user input from the given control for the given root component.
 *
 * Constructs an [[InputFromControl]] instance and makes it available in `root` component's hierarchy.
 *
 * @typeparam Value  Input value type.
 * @param root  Root component context to initiate user input for.
 * @param control  User input control.
 *
 * @returns User input supply. The user input would be stopped once this supply is cut off.
 */
export function inputFromControl<Value>(
    root: ComponentContext,
    control: InControl<Value>,
): Supply {
  return root.get(HierarchyContext)
      .provide({
        a: InputFromControl,
        by: () => ({
          root,
          control,
        }),
      })
      .needs(root)
      .needs(control);
}
