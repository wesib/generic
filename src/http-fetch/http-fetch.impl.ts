import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, EventEmitter, eventInterest, OnEvent, onEventBy, onEventFrom } from 'fun-events';
import { HttpFetch } from './http-fetch';
import { HttpFetchAgent } from './http-fetch-agent';

const HttpFetchAborted = {};

/**
 * @internal
 */
export function newHttpFetch(context: BootstrapContext): HttpFetch {

  const window = context.get(BootstrapWindow);
  const agent = context.get(HttpFetchAgent);

  return (input, init) => onEventFrom(
      agent(
          // HttpEventAgent always substitutes parameters
          fetch as (input?: RequestInfo, init?: RequestInit) => OnEvent<[Response]>,
          input,
          init,
      ),
  );

  function fetch(input: RequestInfo, init?: RequestInit): OnEvent<[Response]> {
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

        if (!init) {
          init = { signal };
        } else {

          const customSignal = init.signal;

          if (customSignal) {
            new DomEventDispatcher(customSignal).on('abort').once(() => abortController.abort());
            if (customSignal.aborted) {
              abortController.abort();
            }
          }

          init = { ...init, signal };
        }
      }

      window.fetch(input, init)
          .then(response => {
            responseEmitter.send(response);
            interest.off();
          })
          .catch(reason => interest.off(reason));

      return result;
    });
  }
}
