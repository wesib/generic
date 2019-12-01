import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { DomEventDispatcher, EventEmitter, EventSupply, eventSupply, OnEvent, onEventBy } from 'fun-events';
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
      let supply: EventSupply;

      if ('AbortController' in window) {

        const abortController = new (window as any).AbortController();
        const { signal } = abortController;

        supply = eventSupply(reason => {
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
          new DomEventDispatcher(customSignal).on('abort').once(() => abortController.abort());
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
