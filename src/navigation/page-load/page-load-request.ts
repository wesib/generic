/**
 * @module @wesib/generic
 */
import { EventReceiver } from 'fun-events';
import { PageLoadResponse } from './page-load-response';

export interface PageLoadRequest {

  readonly receiver: EventReceiver<[PageLoadResponse]>;

}
