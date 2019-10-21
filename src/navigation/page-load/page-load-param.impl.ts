import { BootstrapContext } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { EventEmitter, eventInterest, EventInterest, noEventInterest, onEventBy } from 'fun-events';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { cachingPageLoader } from './caching-page-loader.impl';
import { PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

class PageLoadAbortError extends Error {}

class PageLoadRequests {

  private readonly _map = new Map<EventInterest, PageLoadRequest[]>();

  constructor(
      private readonly _navigation: Navigation,
      private readonly _loader: PageLoader,
  ) {}

  handle(): PageParam.Handle<void, PageLoadRequest> {

    const self = this;
    const pageInterest = eventInterest();
    let loadInterest = noEventInterest();

    return {
      get() {},
      put(request: PageLoadRequest): void {
        self._add(request);
      },
      transfer() {
        return self._transfer().handle();
      },
      enter(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          // The page is loaded already. No need to fetch it.
          return;
        }

        loadInterest = eventInterest().needs(pageInterest);

        const onLoad = onEventBy<[PageLoadResponse]>(responseReceiver => {

          const emitter = new EventEmitter<[PageLoadResponse]>();

          self._loader(page)(response => emitter.send(response)).whenDone(error => {
            if (!(error instanceof PageLoadAbortError)) {
              // Report current page load error as failed load response
              emitter.send({
                ok: false as const,
                page,
                error,
              });
            }
          }).needs(loadInterest);

          return emitter.on(responseReceiver);
        }).share();

        itsEach(
            self._map.values(),
            list => list.forEach(
                ({ interest, receiver }) => onLoad(receiver).needs(interest),
            ),
        );
      },
      leave(): void {
        loadInterest.off(new PageLoadAbortError('page left'));
      },
      stay() {
        pageInterest.off(new PageLoadAbortError('navigation cancelled'));
      },
      forget() {
        pageInterest.off(new PageLoadAbortError('page forgotten'));
      },
    };

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

    const transferred = new PageLoadRequests(this._navigation, this._loader);

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
    this._loader = cachingPageLoader(bsContext.get(PageLoader));
  }

  create(_page: Page, request: PageLoadRequest) {

    const handle = new PageLoadRequests(this._navigation, this._loader).handle();

    handle.put(request);

    return handle;
  }

}
