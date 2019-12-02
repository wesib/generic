import { nextArgs, nextSkip } from 'call-thru';
import { eventSupply, EventSupply, OnEvent, onEventBy, trackValue } from 'fun-events';
import { Page } from '../page';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';

/**
 * @internal
 */
export function cachingPageLoader(loader: PageLoader): PageLoader {

  let state: {
    url: string;
    on: OnEvent<[PageLoadResponse]>;
    sup: EventSupply;
  } | undefined;

  return page => {

    const url = pageUrl(page);

    if (state) {
      if (state.url === url) {
        return state.on;
      }
      state.sup.off();
    }

    let onResponse: OnEvent<[PageLoadResponse]> | undefined;
    const supply = eventSupply().whenOff(() => {
      state = undefined;
      onResponse = undefined;
    });
    let numReceivers = 0;
    const on = onEventBy<[PageLoadResponse]>(receiver => {
      if (!onResponse) {

        const onLoad = loader(page);
        const tracker = trackValue<PageLoadResponse>();
        const trackSupply = onLoad(resp => {
          tracker.it = resp;
        }).whenOff(reason => {
          // Error drops page cache, unlike successful page load.
          if (reason != null) {
            supply.off(reason);
          }
        });

        supply.whenOff(reason => {
          trackSupply.off(reason);
          tracker.done(reason);
        });

        onResponse = tracker.read.thru_(
            response => response ? nextArgs(response) : nextSkip(),
        );
      }
      ++numReceivers;

      const currentOnResponse = onResponse;

      return onResponse(receiver).needs(supply).whenOff(reason => {
        if (!--numReceivers) {
          // Allow to request the same page again
          Promise.resolve().then(() => {
            if (currentOnResponse === onResponse && !numReceivers) {
              supply.off(reason);
            }
          });
        }
      });
    });

    state = { url, on, sup: supply };

    return on;
  };
}

function pageUrl(page: Page): string {
  return new URL('', page.url).href;
}
