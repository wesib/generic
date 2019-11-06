import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { SingleContextKey } from 'context-values';
import { afterThe, EventEmitter, eventSupply, OnEvent, onEventBy } from 'fun-events';
import { hthvParse } from 'http-header-value';
import { HttpFetch } from '../../fetch';
import { Page } from '../page';
import { PageLoadAgent } from './page-load-agent';
import { PageLoadResponse } from './page-load-response';

/**
 * @internal
 */
export type PageLoader = (this: void, page: Page) => OnEvent<[PageLoadResponse]>;

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

  return page => {

    const request = new Request(
        page.url.href,
        {
          mode: 'navigate',
          credentials: 'same-origin',
          headers: new Headers({ 'Accept': 'text/html' })
        },
    );

    return onEventBy(receiver => {
      afterThe<[PageLoadResponse.Start]>({ page }).once({
        supply: eventSupply().needs(receiver.supply),
        receive(ctx, start) {
          receiver.receive(ctx, start);
        }
      });

      agent(fetch, request)(receiver);
    });

    function fetch(fetchRequest: Request): OnEvent<[PageLoadResponse]> {

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
                document: parser.parseFromString(
                    text,
                    hthvParse(response.headers.get('Content-Type') || 'text/html')[0].v as SupportedType,
                ),
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
