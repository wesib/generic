/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';

/**
 * Component input context - a context of user input initiated by component.
 *
 * This is passed to {@link ComponentIn component input} to enable its participation in user input.
 */
export interface ComponentInContext {

  /**
   * A context of component initiating the user input.
   *
   * This is a component containing the ones participating in user input.
   */
  readonly componentContext: ComponentContext;

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
