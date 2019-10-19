import { BootstrapContext } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { eventInterest, EventInterest, noEventInterest, OnEvent, onEventBy } from 'fun-events';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

type PageLoadRequestEntry = readonly [PageLoadRequest, boolean];

class PageLoadRequests {

  private readonly _map = new Map<EventInterest, PageLoadRequestEntry[]>();

  constructor() {
  }

  request(request: PageLoadRequest, transient = false): this {

    const { interest } = request;
    let list = this._map.get(interest);

    if (list) {
      list.push([request, transient]);
    } else {
      list = [[request, transient]];
      this._map.set(interest, list);
      interest.whenDone(() => this._map.delete(interest));
    }

    return this;
  }

  transfer(): PageLoadRequests {

    const transferred = new PageLoadRequests();

    for (const [interest, list] of this._map.entries()) {
      transferred._map.set(interest, list.filter(([, transient]) => !transient));
    }

    return transferred;
  }

  handle(load: PageLoader): PageParam.Handle<OnEvent<[PageLoadResponse]>, PageLoadRequest> {

    const self = this;
    let onLoad: OnEvent<[PageLoadResponse]> | undefined;
    const pageInterest = eventInterest();
    let loadInterest = noEventInterest();
    const value: OnEvent<[PageLoadResponse]> = onEventBy(receiver => {

      const interest = eventInterest();

      interest.needs(addRequest({ interest: interest, receiver }, true));

      return interest;
    });

    return {
      get() {
        return value;
      },
      refine(request: PageLoadRequest): void {
        addRequest(request);
      },
      transfer() {
        return self.transfer().handle(load);
      },
      enter(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          // The page is loaded already. No need to fetch it.
          return;
        }

        const onResponse = onLoad = load(page).share();

        loadInterest = eventInterest(() => onLoad = undefined).needs(pageInterest);
        itsEach(self._map.values(), list => list.forEach(([request]) => {
          loadPage(onResponse, request);
        }));
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

    function addRequest(request: PageLoadRequest, transient?: boolean): EventInterest {
      self.request(request, transient);
      if (onLoad) {
        // Page load is already started. Report the response.
        return loadPage(onLoad, request);
      }
      return eventInterest();
    }

    function loadPage(onResponse: OnEvent<[PageLoadResponse]>, { interest, receiver }: PageLoadRequest) {
      return onResponse(receiver)
          .needs(interest)
          .needs(loadInterest);
    }
  }

}

/**
 * @internal
 */
export class PageLoadParam extends PageParam<OnEvent<[PageLoadResponse]>, PageLoadRequest> {

  private readonly _loader: PageLoader;

  constructor(bsContext: BootstrapContext) {
    super();
    this._loader = bsContext.get(PageLoader);
  }

  create(
      _page: Page,
      request: PageLoadRequest,
  ): PageParam.Handle<OnEvent<[PageLoadResponse]>, PageLoadRequest> {
    return new PageLoadRequests().request(request).handle(this._loader);
  }

}
