/**
 * @module @wesib/generic
 */
import { EventReceiver, EventSupply } from 'fun-events';
import { PageLoadResponse } from './page-load-response';

export interface PageLoadRequest {

  readonly supply: EventSupply;

  readonly receiver: EventReceiver<[PageLoadResponse]>;

}
