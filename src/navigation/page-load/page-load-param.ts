import { itsEach } from 'a-iterable';
import {
  EventEmitter,
  eventReceiver,
  EventReceiver,
  eventSupply,
  EventSupply,
  noEventSupply,
  onEventBy,
} from 'fun-events';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageParamContext } from '../page-param-context';
import { PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

class PageLoadAbortError extends Error {}

class PageLoadRequests {

  private readonly _map = new Map<EventSupply, PageLoadReq[]>();

  constructor(
      private readonly _navigation: Navigation,
      private readonly _loader: PageLoader,
  ) {}

  handle(): PageParam.Handle<void, PageLoadRequest> {

    const self = this;
    const pageSupply = eventSupply();
    let loadSupply = noEventSupply();

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

        loadSupply = eventSupply().needs(pageSupply);

        const onLoad = onEventBy<[PageLoadResponse]>(responseReceiver => {

          const emitter = new EventEmitter<[PageLoadResponse]>();

          self._loader(page)(response => emitter.send(response)).whenOff(error => {
            if (!(error instanceof PageLoadAbortError)) {
              // Report current page load error as failed load response
              emitter.send({
                ok: false as const,
                page,
                error,
              });
            }
          }).needs(loadSupply);

          return emitter.on(responseReceiver);
        }).share();

        itsEach(
            self._map.values(),
            list => list.forEach(
                ({ receiver }) => onLoad({
                  supply: eventSupply().needs(receiver.supply),
                  receive(context, response): void {
                    receiver.receive(context, response);
                  },
                }),
            ),
        );
      },
      leave(): void {
        loadSupply.off(new PageLoadAbortError('page left'));
      },
      stay() {
        pageSupply.off(new PageLoadAbortError('navigation cancelled'));
      },
      forget() {
        pageSupply.off(new PageLoadAbortError('page forgotten'));
      },
    };

  }

  private _add(request: PageLoadRequest) {

    const req = { ...request, receiver: eventReceiver(request.receiver) };
    const { supply } = req.receiver;
    const list = this._map.get(supply);

    if (list) {
      list.push(req);
    } else {
      this._map.set(supply, [req]);
      supply.whenOff(() => this._map.delete(supply));
    }
  }

  private _transfer(): PageLoadRequests {

    const transferred = new PageLoadRequests(this._navigation, this._loader);

    for (const [supply, list] of this._map.entries()) {
      transferred._map.set(supply, list);
    }

    return transferred;
  }

}

class PageLoadParam extends PageParam<void, PageLoadRequest> {

  create(_page: Page, request: PageLoadRequest, context: PageParamContext) {

    const handle = new PageLoadRequests(context.get(Navigation), context.get(PageLoader)).handle();

    handle.put(request);

    return handle;
  }

}

interface PageLoadReq extends PageLoadRequest {

  readonly receiver: EventReceiver.Generic<[PageLoadResponse]>;

}

/**
 * Page load parameter.
 *
 * Accepts a {@link PageLoadRequest page load request} as input.
 *
 * A page load is initiated whenever a page with new address is {@link Navigation.onEnter entered}.
 *
 * Page load won't be initiated if:
 * - page load parameter is not {@link Page.put} added,
 * - all added {@link PageLoadRequest.receiver response receiver}s supplies are cut off, or
 * - the entered page address is the the same one as previous one, except the hash,
 */
export const pageLoadParam: PageParam<void, PageLoadRequest> = /*#__PURE__*/ new PageLoadParam();
