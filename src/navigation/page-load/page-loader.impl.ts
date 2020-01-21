import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { itsReduction } from 'a-iterable';
import { SingleContextKey } from 'context-values';
import { afterThe, EventEmitter, eventSupply, OnEvent, onEventBy } from 'fun-events';
import { hthvParse, hthvQuote } from 'http-header-value';
import { HttpFetch } from '../../fetch';
import { Page } from '../page';
import { PageLoadAgent } from './page-load-agent';
import { pageLoadRequestsParam } from './page-load-requests.impl';
import { PageLoadResponse } from './page-load-response';
import { PageLoadURLModifier } from './page-load-url-modifier';

/**
 * @internal
 */
export type PageLoader = (this: void, page: Page) => OnEvent<[PageLoadResponse]>;

/**
 * @internal
 */
export const PageLoader = (/*#__PURE__*/ new SingleContextKey<PageLoader>(
    'page-loader',
    {
      byDefault: bootstrapDefault(newPageLoader),
    },
));

function newPageLoader(context: BootstrapContext): PageLoader {

  const window = context.get(BootstrapWindow);
  const httpFetch = context.get(HttpFetch);
  const modifyURL = context.get(PageLoadURLModifier);
  const agent = context.get(PageLoadAgent);
  const parser: DOMParser = new (window as any).DOMParser();

  return page => {

    const url = new URL(page.url.href);

    modifyURL(url);

    const request = new Request(
        url.href,
        {
          mode: 'same-origin',
          credentials: 'same-origin',
          headers: new Headers({ Accept: 'text/html' }),
        },
    );

    return onEventBy(receiver => agent(fetch, request)(receiver));

    function fetch(fetchRequest: Request): OnEvent<[PageLoadResponse]> {
      fetchRequest = pageFragmentsRequest(page, fetchRequest);

      const responseTextEmitter = new EventEmitter<[Response, string]>();
      const onResponse: OnEvent<[PageLoadResponse]> = responseTextEmitter.on.thru_(
          (response, text) => {
            if (!response.ok) {
              return {
                ok: false as const,
                page,
                response,
                error: response.status,
              };
            }
            try {
              return {
                ok: true as const,
                page,
                response,
                document: parsePageDocument(parser, url, response, text),
              };
            } catch (error) {
              return {
                ok: false as const,
                page,
                response,
                error,
              };
            }
          },
      );

      return onEventBy<[PageLoadResponse]>(receiver => {

        const { supply } = receiver;

        afterThe<[PageLoadResponse.Start]>({ page }).once({
          supply: eventSupply().needs(supply),
          receive(ctx, start) {
            receiver.receive(ctx, start);
          },
        });

        const responseSupply = httpFetch(fetchRequest)(response => {
          onResponse(receiver);
          response.text().then(
              text => {
                responseTextEmitter.send(response, text);
                supply.needs(responseSupply);
              },
          ).catch(
              e => supply.off(e),
          );
        });
      });
    }
  };
}

function pageFragmentsRequest(page: Page, request: Request): Request {

  const fragments = page.get(pageLoadRequestsParam)?.fragments;

  if (!fragments || !fragments.length) {
    return request;
  }

  return new Request(
      request,
      {
        headers: {
          'Accept-Fragment': itsReduction(
              fragments,
              (header, fragment) =>
                  (header ? header + ', ' : '')
                  + (
                      fragment.tag != null
                          ? 'tag=' + hthvQuote(fragment.tag)
                          : 'id=' + hthvQuote(fragment.id)
                  ),
              '',
          ),
        },
      },
  );
}

function parsePageDocument(parser: DOMParser, url: URL, response: Response, text: string): Document {

  const doc = parser.parseFromString(
      text,
      hthvParse(response.headers.get('Content-Type') || 'text/html')[0].v as SupportedType,
  );

  if (doc.head) {

    const base = doc.head.querySelector('base');

    if (base) {
      base.href = new URL(base.getAttribute('href')!, url).href;
    } else {

      const newBase = doc.createElement('base');

      newBase.href = url.href;

      doc.head.appendChild(newBase);
    }
  }

  return doc;
}
