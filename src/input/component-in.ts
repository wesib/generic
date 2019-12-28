/**
 * @module @wesib/generic
 */
import { MultiContextKey, MultiContextRef } from 'context-values';
import { EventKeeper, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentNode } from '../tree';

/**
 * Component input.
 *
 * This is an event keeper that supplies component's participants in user input. A component participating in user input
 * should have this instance in its context.
 */
export type ComponentIn = EventKeeper<ComponentIn.Participant[]>;

/**
 * A key of component context value containing an array of event keepers sending component inputs.
 */
export const ComponentIn: MultiContextRef<ComponentIn> =
    (/*#__PURE__*/ new MultiContextKey<ComponentIn>('component-in'));

export namespace ComponentIn {

  /**
   * A participant in user input defined in component.
   *
   * This is a function invoked by parent component to enable participation in user input. E.g. via input aspects.
   */
  export type Participant =
  /**
   * @param participation  A participation in user input to set.
   *
   * @returns A participation supply. When this supply is cut off the participation is disabled.
   */
      (this: void, participation: Participation) => EventSupply;

  /**
   * A participation of component in user input context.
   *
   * This is passed to {@link Participant user input participant} to set its participation.
   */
  export interface Participation {

    /**
     * Root component node initiating the user input.
     *
     * This node contains the ones participating in user input.
     */
    readonly root: ComponentNode;

    /**
     * User input control.
     */
    readonly control: InControl<any>;

  }

}
