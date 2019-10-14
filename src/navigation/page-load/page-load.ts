/**
 * @module @wesib/generic
 */
import { EventSender, OnEvent, OnEvent__symbol } from 'fun-events';
import { Page } from '../page';

export abstract class PageLoad implements EventSender<[Document]> {

  abstract readonly page: Page;

  abstract readonly on: OnEvent<[Document]>;

  get [OnEvent__symbol](): OnEvent<[Document]> {
    return this.on;
  }

}
