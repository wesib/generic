import { nextArgs, nextSkip } from 'call-thru';
import { eventInterest, EventInterest, OnEvent, onEventBy, trackValue } from 'fun-events';
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
    ist: EventInterest;
  } | undefined;

  return page => {

    const url = pageUrl(page);

    if (state) {
      if (state.url === url) {
        return state.on;
      }
      state.ist.off();
    }

    const ist = eventInterest().whenDone(() => state = undefined);
    let onResponse: OnEvent<[PageLoadResponse]> | undefined;
    let numReceivers = 0;
    const on = onEventBy<[PageLoadResponse]>(receiver => {
      if (!onResponse) {

        const onLoad = loader(page);
        const tracker = trackValue<PageLoadResponse>().by(onLoad);

        ist.whenDone(reason => {
          tracker.off(reason);
          tracker.done(reason);
        });

        onResponse = tracker.read.thru_(
            response => response ? nextArgs(response) : nextSkip(),
        );
      }
      ++numReceivers;

      const currentOnResponse = onResponse;

      return onResponse(receiver).whenDone(reason => {
        if (!--numReceivers) {
          // Allow to request the same page again
          Promise.resolve().then(() => {
            if (currentOnResponse === onResponse && !numReceivers) {
              ist.off(reason);
            }
          });
        }
      });
    });

    state = { url, on, ist };

    return on;
  };
}

function pageUrl(page: Page): string {
  return new URL('', page.url).href;
}
