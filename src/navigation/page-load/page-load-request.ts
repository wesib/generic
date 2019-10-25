/**
 * @module @wesib/generic
 */
import { EventInterest, EventReceiver } from 'fun-events';
import { PageLoadResponse } from './page-load-response';

export interface PageLoadRequest {

  readonly interest: EventInterest;

  readonly receiver: EventReceiver<[PageLoadResponse]>;

}
