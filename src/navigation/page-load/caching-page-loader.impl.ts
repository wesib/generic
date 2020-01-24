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
    readonly url: string;
    readonly on: OnEvent<[PageLoadResponse]>;
    readonly sup: EventSupply;
  } | undefined;

  return page => {

    const url = pageUrl(page);

    if (state) {
      if (state.url === url) {
        return state.on;
      }
      state.sup.off();
    }

    let tracked: {
      readonly on: OnEvent<[PageLoadResponse]>;
      num: number;
    } | undefined;
    const supply = eventSupply().whenOff(() => {
      state = undefined;
      tracked = undefined;
    });

    const on = onEventBy<[PageLoadResponse]>(receiver => {
      if (!tracked) {

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

        tracked = {
          on: tracker.read.thru_(
              response => response ? nextArgs(response) : nextSkip(),
          ),
          num: 0,
        };
      }

      const requested = tracked;

      ++requested.num;

      return requested.on(receiver).needs(supply).whenOff(reason => {
        if (!--requested.num) {
          // Allow to request the same page again
          Promise.resolve().then(() => {
            if (!requested.num && requested === tracked) {
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