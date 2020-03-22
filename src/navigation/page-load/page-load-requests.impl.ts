import { flatMapIt, itsEach, itsIterator } from '@proc7ts/a-iterable';
import { noop } from '@proc7ts/call-thru';
import {
  EventEmitter,
  eventReceiver,
  EventReceiver,
  eventSupply,
  EventSupply,
  noEventSupply,
  OnEvent,
  onEventBy,
} from '@proc7ts/fun-events';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageFragmentRequest, PageLoadRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

/**
 * @internal
 */
export interface PageLoadReq extends PageLoadRequest {

  readonly receiver: EventReceiver.Generic<[PageLoadResponse]>;

}

class PageLoadAbortError extends Error {}

class PageLoadRequestsParam$ extends PageParam<PageLoadRequests, PageLoadRequests> {

  create(
      _page: Page,
      requests: PageLoadRequests,
  ): PageParam.Handle<PageLoadRequests, PageLoadRequests> {
    return {
      get() {
        return requests;
      },
      put: noop,
    };
  }

}

/**
 * @internal
 */
export const PageLoadRequestsParam: PageParam<PageLoadRequests, PageLoadRequests> = new PageLoadRequestsParam$();

/**
 * @internal
 */
export class PageLoadRequests implements Iterable<PageLoadReq> {

  private readonly _map = new Map<EventSupply, PageLoadReq[]>();

  constructor(
      private readonly _navigation: Navigation,
      private readonly _loader: PageLoader,
  ) {}

  get fragments(): readonly PageFragmentRequest[] {

    const result: PageFragmentRequest[] = [];

    for (const request of this) {
      if (!request.fragment) {
        return [];
      }
      result.push(request.fragment);
    }

    return result;
  }

  [Symbol.iterator](): Iterator<PageLoadReq> {
    return itsIterator(flatMapIt(this._map.values()));
  }

  handle(): PageParam.Handle<void, PageLoadRequest> {

    const self = this;
    const pageSupply = eventSupply();
    let loadSupply = noEventSupply();

    return {
      get() {/* void */},
      put(request: PageLoadRequest): void {
        self._add(request);
      },
      transfer(to: Page, when) {
        if (when === 'pretend') {
          return;
        }

        const transferred = self._transfer();

        to.put(PageLoadRequestsParam, transferred);

        return transferred.handle();
      },
      enter(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void {
        if (when === 'init') {
          // The page is loaded already. No need to fetch it.
          return;
        }

        loadSupply = eventSupply().needs(pageSupply);

        const onLoad = onEventBy<[PageLoadResponse]>(responseReceiver => {

          const emitter = new EventEmitter<[PageLoadResponse]>();
          const supply = emitter.on(responseReceiver);

          self._loader(page)
              .tillOff(loadSupply)
              .to(response => emitter.send(response))
              .whenOff(error => {
                if (error !== undefined && !(error instanceof PageLoadAbortError)) {
                  // Report current page load error as failed load response
                  emitter.send({
                    ok: false as const,
                    page,
                    error,
                  });
                }
              });

          return supply;
        }).share();

        itsEach(
            self,
            ({ fragment, receiver }) => onFragment(onLoad, fragment).to({
              supply: eventSupply().needs(receiver.supply),
              receive(context, response): void {
                receiver.receive(context, response);
              },
            }),
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

  private _add(request: PageLoadRequest): void {

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
      transferred._map.set(supply, Array.from(list));
    }

    return transferred;
  }

}

function onFragment(
    onLoad: OnEvent<[PageLoadResponse]>,
    fragment?: PageFragmentRequest,
): OnEvent<[PageLoadResponse]> {
  return fragment
      ? onLoad.thru_(
          response => response.ok
              ? {
                ...response,
                fragment: (
                    fragment.tag != null
                        ? response.document.getElementsByTagName(fragment.tag)[0]
                        : response.document.getElementById(fragment.id)
                ) || undefined,
              }
              : response,
      )
      : onLoad;
}
