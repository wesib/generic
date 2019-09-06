import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { afterEventBy, DomEventDispatcher, EventEmitter } from 'fun-events';
import { HttpFetch } from './http-fetch';

/**
 * @internal
 */
export function newHttpFetch(context: BootstrapContext): HttpFetch {

  const window = context.get(BootstrapWindow);

  return (input, init) => afterEventBy(receiver => {

    const responseEmitter = new EventEmitter<[Response]>();
    const interest = responseEmitter.on(receiver);

    if ('AbortController' in window) {

      const abortController = new (window as any).AbortController();
      const { signal } = abortController;

      interest.whenDone(() => abortController.abort());

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
        .then(response => responseEmitter.send(response))
        .catch(reason => interest.off(reason));

    return interest;
  });
}
