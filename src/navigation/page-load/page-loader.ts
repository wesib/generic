import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { SingleContextKey } from 'context-values';
import { EventEmitter, EventInterest, eventInterest, OnEvent, onEventBy } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { Page } from '../page';
import { PageLoadAgent } from './page-load-agent';

/**
 * @internal
 */
export type PageLoader = (this: void, page: Page, interest: EventInterest) => OnEvent<[Document]>;

/**
 * @internal
 */
export const PageLoader = /*#__PURE__*/ new SingleContextKey<PageLoader>(
    'page-loader',
    {
      byDefault: bootstrapDefault(newPageLoader),
    },
);

function newPageLoader(context: BootstrapContext): PageLoader {

  const window = context.get(BootstrapWindow);
  const httpFetch = context.get(HttpFetch);
  const agent = context.get(PageLoadAgent);
  const parser: DOMParser = new (window as any).DOMParser();

  return (page, resultInterest) => {

    const request = new Request(
        page.url.href,
        {
          mode: 'navigate',
          credentials: 'same-origin',
          headers: new Headers({ 'Accept': 'text/html' })
        },
    );

    return agent(fetch, request);

    function fetch(fetchRequest: Request): OnEvent<[Document]> {

      const responseTextEmitter = new EventEmitter<[Response, string]>();
      const onDocument: OnEvent<[Document]> = responseTextEmitter.on.thru_(
          (response, text) => parser.parseFromString(text, pageLoadResponseType(response)),
      );

      return onEventBy<[Document]>(receiver => {

        const interest = eventInterest();
        const responseInterest = httpFetch(fetchRequest)(response => {
          onDocument(receiver).needs(interest);
          response.text().then(
              text => {
                interest.needs(responseInterest);
                responseTextEmitter.send(response, text);
              },
          ).catch(
              e => interest.off(e),
          );
        }).needs(resultInterest);

        return interest;
      });
    }
  };
}

function pageLoadResponseType(response: Response): SupportedType {

  let contentType = response.headers.get('Content-Type') || 'text/html';
  const scIdx = contentType.indexOf(';');

  if (scIdx >= 0) {
    contentType = contentType.substring(0, scIdx);
  }

  return contentType as SupportedType;
}
