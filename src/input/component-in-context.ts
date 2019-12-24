/**
 * @module @wesib/generic
 */
import { EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentNode } from '../tree';

/**
 * Component input context - a context of user input initiated by component.
 *
 * This is passed to {@link ComponentIn component input} to enable its participation in user input.
 */
export interface ComponentInContext {

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

  /**
   * Participation supply.
   *
   * When this supply is cut off the component input should disable its participation in user input.
   */
  readonly supply: EventSupply;

}
