import { BootstrapContext } from '@wesib/wesib';
import { EventEmitter, eventInterest, EventInterest, EventReceiver, noEventInterest, OnEvent } from 'fun-events';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageLoad as PageLoad_ } from './page-load';
import { PageLoader } from './page-loader';

/**
 * @internal
 */
export class PageLoadParam extends PageParam<OnEvent<[PageLoad_]>, EventReceiver<[PageLoad_]>> {

  private readonly _load: PageLoader;

  constructor(bsContext: BootstrapContext) {
    super();
    this._load = bsContext.get(PageLoader);
  }

  create(
      _page: Page,
      receiver: EventReceiver<[PageLoad_]>,
  ): PageParam.Handle<OnEvent<[PageLoad_]>, EventReceiver<[PageLoad_]>> {

    const { _load: load } = this;
    const onPage = new EventEmitter<[PageLoad_]>();
    let interest: EventInterest = noEventInterest();

    onPage.on(receiver);

    return {
      get() {
        return onPage.on;
      },
      refine(newReceiver: EventReceiver<[PageLoad_]>): void {
        onPage.on(newReceiver);
      },
      enter(enteredPage: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          return; // The page is loaded already. No need to fetch it.
        }

        const onDocument = load(enteredPage, interest = eventInterest());

        class PageLoad extends PageLoad_ {
          get page() {
            return enteredPage;
          }
          get on() {
            return onDocument;
          }
        }

        onPage.send(new PageLoad());
      },
      leave(): void {
        interest.off('page left');
      }
    };
  }

}
