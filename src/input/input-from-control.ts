/**
 * @packageDocumentation
 * @module @wesib/generic/input
 */
import { ComponentContext } from '@wesib/wesib';
import { SingleContextUpKey, SingleContextUpRef } from 'context-values';
import { eventSupply, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';

/**
 * A user input originated from control.
 *
 * It is meant to be present in root {@link HierarchyContext hierarchy context}. Nested components may access it from
 * their hierarchy contexts to participate in user input.
 *
 * An [[inputFromControl]] function can be used to initiate user input.
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
 * A user input originated from nowhere.
 */
export interface InputFromNowhere {
  control?: undefined;
}

/**
 * A key of hierarchy context value containing a user input originated from control. Potentially
 * {@link InputFromNowhere absent}.
 */
export const InputFromControl: SingleContextUpRef<InputFromControl | InputFromNowhere> = (
    /*#__PURE__*/ new SingleContextUpKey<InputFromControl | InputFromNowhere>(
        'input-receiver',
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
 * @param root  Root component context to initiate user input for.
 * @param control  User input control.
 *
 * @returns User input supply. The user input would be stopped once this supply is cut off.
 */
export function inputFromControl<Value>(
    root: ComponentContext,
    control: InControl<Value>,
): EventSupply {

  const off = root.get(HierarchyContext).provide({
    a: InputFromControl,
    by: () => ({
      root,
      control,
    }),
  });

  return eventSupply(off);
}
