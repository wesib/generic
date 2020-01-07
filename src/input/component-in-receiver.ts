/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { SingleContextKey, SingleContextRef } from 'context-values';

/**
 * A receiver of user input inside component.
 *
 * A component that initiated user input should have this in its context. Only one input receiver allowed per component.
 */
export interface ComponentInReceiver {

  /**
   * A context of root component initiating the user input.
   *
   * This component encloses the ones participating in user input.
   */
  readonly root: ComponentContext;

}

/**
 * A key of component context value containing an input receiver.
 */
export const ComponentInReceiver: SingleContextRef<ComponentInReceiver> =
    (/*#__PURE__*/ new SingleContextKey<ComponentInReceiver>('component-in-receiver'));
