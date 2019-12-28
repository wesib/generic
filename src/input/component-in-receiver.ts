/**
 * @module @wesib/generic
 */
import { SingleContextKey, SingleContextRef } from 'context-values';
import { ComponentNode } from '../tree';

/**
 * A receiver of user input inside component.
 *
 * A component that initiated user input should have this in its context. Only one input receiver allowed per component.
 */
export interface ComponentInReceiver {

  /**
   * Root component node initiating the user input.
   *
   * This node contains the ones participating in user input.
   */
  readonly root: ComponentNode;

}

/**
 * A key of component context value containing an input receiver.
 */
export const ComponentInReceiver: SingleContextRef<ComponentInReceiver> =
    (/*#__PURE__*/ new SingleContextKey<ComponentInReceiver>('component-in-receiver'));
