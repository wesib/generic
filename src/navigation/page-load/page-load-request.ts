/**
 * @module @wesib/generic
 */
import { EventReceiver } from 'fun-events';
import { PageLoadResponse } from './page-load-response';

/**
 * Page load request.
 *
 * Accepted as a input of {@link pageLoadParam page load parameter}.
 */
export interface PageLoadRequest {

  /**
   * Page load events receiver.
   *
   * Will be notified on {@link PageLoadResponse page load response} events whenever page loaded.
   * The notifications would no longer be sent one {@link PageLoadRequest.receiver request receiver}'s supply
   * is cut off.
   */
  readonly receiver: EventReceiver<[PageLoadResponse]>;

}
