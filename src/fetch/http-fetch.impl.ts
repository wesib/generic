import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, EventEmitter, eventInterest, OnEvent, onEventBy } from 'fun-events';
import { HttpFetch } from './http-fetch';
import { HttpFetchAgent } from './http-fetch-agent';

const HttpFetchAborted = {};

/**
 * @internal
 */
export function newHttpFetch(context: BootstrapContext): HttpFetch {

  const window = context.get(BootstrapWindow);
  const agent = context.get(HttpFetchAgent);

  return (input, init) => agent(fetch, new Request(input, init));

  function fetch(request: Request): OnEvent<[Response]> {
    return onEventBy(receiver => {

      const responseEmitter = new EventEmitter<[Response]>();
      const interest = responseEmitter.on(receiver);
      let result = interest;

      if ('AbortController' in window) {

        const abortController = new (window as any).AbortController();
        const { signal } = abortController;

        result = eventInterest(() => interest.off(HttpFetchAborted)).needs(interest);
        interest.whenDone(reason => {
          if (reason === HttpFetchAborted) {
            abortController.abort();
          }
        });

        const customSignal = request.signal;

        if (customSignal) {
          new DomEventDispatcher(customSignal).on('abort').once(() => abortController.abort());
          if (customSignal.aborted) {
            abortController.abort();
          }
        }

        request = new Request(request, { signal });
      }

      window.fetch(request)
          .then(response => {
            responseEmitter.send(response);
            interest.off();
          })
          .catch(reason => interest.off(reason));

      return result;
    });
  }
}
