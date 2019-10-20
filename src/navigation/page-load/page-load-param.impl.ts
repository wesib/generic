import { BootstrapContext } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { EventEmitter, eventInterest, EventInterest, noEventInterest, OnEvent, onEventBy } from 'fun-events';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

class PageLoadRequests {

  private readonly _map = new Map<EventInterest, PageLoadRequest[]>();

  constructor(
      private readonly _navigation: Navigation,
      private readonly _loader: PageLoader,
      private readonly _page: Page,
  ) {}

  handle(): PageParam.Handle<void, PageLoadRequest> {

    const self = this;
    let onLoad: OnEvent<[PageLoadResponse]> | undefined;
    const pageInterest = eventInterest();
    let loadInterest = noEventInterest();

    return {
      get() {},
      put(request: PageLoadRequest): void {
        self._add(request);
        if (onLoad) {
          // Page load is already started. Report the response.
          requestPage(onLoad, request);
        }
      },
      transfer(to) {
        return self._transfer(to).handle();
      },
      enter(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          // The page is loaded already. No need to fetch it.
          return;
        }

        loadInterest = eventInterest(() => onLoad = undefined).needs(pageInterest);

        const onResponse = onLoad = onEventBy<[PageLoadResponse]>(responseReceiver => {

          const emitter = new EventEmitter<[PageLoadResponse]>();

          self._loader(page)(response => emitter.send(response)).whenDone(error => {
            self._navigation.read.once(current => {
              if (current === self._page) {
                // Report current page load error as failed load response
                emitter.send({
                  ok: false as const,
                  page: current,
                  error,
                });
              }
            });
          }).needs(loadInterest);

          return emitter.on(responseReceiver).whenDone(reason => emitter.done(reason));
        }).share();

        itsEach(self._map.values(), list => list.forEach(request => requestPage(onResponse, request)));
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

    function requestPage(onResponse: OnEvent<[PageLoadResponse]>, { interest, receiver }: PageLoadRequest) {
      onResponse(receiver).needs(interest);
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

  private _transfer(to: Page): PageLoadRequests {

    const transferred = new PageLoadRequests(this._navigation, this._loader, to);

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

  private readonly _navigation: Navigation;
  private readonly _loader: PageLoader;

  constructor(bsContext: BootstrapContext) {
    super();
    this._navigation = bsContext.get(Navigation);
    this._loader = bsContext.get(PageLoader);
  }

  create(page: Page, request: PageLoadRequest) {

    const handle = new PageLoadRequests(this._navigation, this._loader, page).handle();

    handle.put(request);

    return handle;
  }

}
