import { DomEventDispatcher } from '@frontmeans/dom-events';
import { CxEntry, cxRecent } from '@proc7ts/context-values';
import { EventEmitter, onceOn, OnEvent, onEventBy } from '@proc7ts/fun-events';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { BootstrapWindow } from '@wesib/wesib';
import { HttpFetchAgent } from './http-fetch-agent';

/**
 * HTTP fetch function signature.
 *
 * This is a function that wraps browser's
 * [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) function and provides
 * additional functionality. E.g. request interception.
 *
 * This function returns an `OnEvent` sender instead of a `Promise`. This allows to report multiple responses.
 * E.g. when the resource refresh requested and delivered. The request is sent whenever a receiver is registered
 * in this sender. When the fetch completes the response supply is cut off, and callbacks registered with its
 * `whenOff()` method are notified. When fetch fails for whatever reason, this reason is passed to these callbacks.
 * The fetch can be aborted by cutting off the response supply. I.e. by calling its `off()` method.
 *
 * An instance of {@link HttpFetch} is available from bootstrap context.
 */
export type HttpFetch =
/**
 * @param input - The resource to fetch. This can either an URL string, or a `Request` object.
 * @param init - Custom settings to apply to the request.
 *
 * @returns An `OnEvent` sender of responses.
 */
    (this: void, input: RequestInfo, init?: RequestInit) => OnEvent<[Response]>;

/**
 * Bootstrap context entity containing an {@link HttpFetch} instance.
 */
export const HttpFetch: CxEntry<HttpFetch> = {
  perContext: (/*#__PURE__*/ cxRecent<HttpFetch, HttpFetch, HttpFetch>({
    create: asis,
    byDefault: HttpFetch$createDefault,
    assign: ({ get }) => receiver => receiver((input, init) => get()(input, init)),
  })),
  toString: () => '[HttpFetch]',
};

const HttpFetchAborted = {};

function HttpFetch$createDefault(target: CxEntry.Target<HttpFetch>): HttpFetch {

  const window = target.get(BootstrapWindow);
  const agent = target.get(HttpFetchAgent);

  return (input, init) => agent(fetch, new Request(input, init));

  function fetch(request: Request): OnEvent<[Response]> {
    return onEventBy(receiver => {

      const responseEmitter = new EventEmitter<[Response]>();
      let supply: Supply;

      if ('AbortController' in window) {

        const abortController = new window.AbortController();
        const { signal } = abortController;

        supply = new Supply(reason => {
          if (reason === HttpFetchAborted) {
            abortController.abort();
          }
        });
        receiver.supply.whenOff(() => supply.off(HttpFetchAborted)).needs(supply);
        responseEmitter.on({
          supply,
          receive(ctx, response) {
            receiver.receive(ctx, response);
          },
        });

        const customSignal = request.signal;

        if (customSignal) {
          new DomEventDispatcher(customSignal)
              .on('abort')
              .do(onceOn)(
                  () => abortController.abort(),
              );
          if (customSignal.aborted) {
            abortController.abort();
          }
        }

        request = new Request(request, { signal });
      } else {
        supply = responseEmitter.on(receiver);
      }

      window.fetch(request)
          .then(response => {
            responseEmitter.send(response);
            supply.off();
          })
          .catch(reason => supply.off(reason));
    });
  }
}
