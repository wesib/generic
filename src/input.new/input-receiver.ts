/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { SingleContextUpKey, SingleContextUpRef } from 'context-values';
import { eventSupply, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';

/**
 * A receiver of user input.
 *
 * It is meant to be present in root {@link HierarchyContext hierarchy context}. Nested components may access it from
 * their hierarchy contexts to participate in user input.
 *
 * A [[receiveInput]] can be used to initiate user input.
 */
export interface InputReceiver<Value = any> {

  /**
   * Root component context.
   */
  readonly root: ComponentContext;

  /**
   * User input control.
   */
  readonly control: InControl<Value>;

}

export namespace InputReceiver {

  /**
   * An absent receiver of user input.
   */
  export interface Absent {
    control?: undefined;
  }

}

/**
 * A key of hierarchy context value containing a user input receiver. Potentially {@link InputReceiver.Absent absent}.
 */
export const InputReceiver: SingleContextUpRef<InputReceiver | InputReceiver.Absent> =
    (/*#__PURE__*/ new SingleContextUpKey<InputReceiver | InputReceiver.Absent>(
        'input-receiver',
        {
          byDefault: () => ({}),
        },
    ));

/**
 * Initiates user input for root component with the given input control.
 *
 * Constructs {@link InputReceiver input receiver} and makes it available in `root` component's hierarchy.
 *
 * @param root  Root component context.
 * @param control  User input control.
 *
 * @returns User input supply. The user input would be stopped once this supply is cut off.
 */
export function receiveInput<Value>(
    root: ComponentContext,
    control: InControl<Value>,
): EventSupply {

  const off = root.get(HierarchyContext).provide({
    a: InputReceiver,
    by: () => ({
      root,
      control,
    }),
  });

  return eventSupply(off);
}
