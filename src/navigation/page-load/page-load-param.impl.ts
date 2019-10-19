import { BootstrapContext } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { eventInterest, EventInterest, noEventInterest, OnEvent } from 'fun-events';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

class PageLoadRequests {

  private readonly _map = new Map<EventInterest, PageLoadRequest[]>();

  constructor() {
  }

  handle(load: PageLoader): PageParam.Handle<void, PageLoadRequest> {

    const self = this;
    let onLoad: OnEvent<[PageLoadResponse]> | undefined;
    const pageInterest = eventInterest();
    let loadInterest = noEventInterest();

    return {
      get() {},
      refine(request: PageLoadRequest): void {
        self._add(request);
        if (onLoad) {
          // Page load is already started. Report the response.
          loadPage(onLoad, request);
        }
      },
      transfer() {
        return self._transfer().handle(load);
      },
      enter(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          // The page is loaded already. No need to fetch it.
          return;
        }

        const onResponse = onLoad = load(page).share();

        loadInterest = eventInterest(() => onLoad = undefined).needs(pageInterest);
        itsEach(self._map.values(), list => list.forEach(request => loadPage(onResponse, request)));
      },
      leave(): void {
        loadInterest.off('page left');
      },
      stay() {
        pageInterest.off('navigation cancelled');
      },
      forget() {
        pageInterest.off('page forgotten');
      },
    };

    function loadPage(onResponse: OnEvent<[PageLoadResponse]>, { interest, receiver }: PageLoadRequest) {
      onResponse(receiver)
          .needs(interest)
          .needs(loadInterest);
    }
  }

  private _add(request: PageLoadRequest) {

    const { interest } = request;
    const list = this._map.get(interest);

    if (list) {
      list.push(request);
    } else {
      this._map.set(interest, [request]);
      interest.whenDone(() => this._map.delete(interest));
    }
  }

  private _transfer(): PageLoadRequests {

    const transferred = new PageLoadRequests();

    for (const [interest, list] of this._map.entries()) {
      transferred._map.set(interest, list);
    }

    return transferred;
  }

}

/**
 * @internal
 */
export class PageLoadParam extends PageParam<void, PageLoadRequest> {

  private readonly _loader: PageLoader;

  constructor(bsContext: BootstrapContext) {
    super();
    this._loader = bsContext.get(PageLoader);
  }

  create(_page: Page, request: PageLoadRequest) {

    const handle = new PageLoadRequests().handle(this._loader);

    handle.refine(request);

    return handle;
  }

}
