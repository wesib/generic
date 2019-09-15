import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { nextArgs } from 'call-thru';
import { EventEmitter, eventInterest, EventInterest, OnEvent, onEventBy } from 'fun-events';
import { DomFetch, DomFetchResult } from './dom-fetch';
import { DomFetchMutator } from './dom-fetch-mutator';
import { HttpFetch } from './http-fetch';

/**
 * @internal
 */
export function newDomFetch(context: BootstrapContext): DomFetch {
  return (input, init?) => new DocumentFetchResult(context, new Request(input, init));
}

class DocumentFetchResult implements DomFetchResult {

  readonly onResponse: OnEvent<[Response]>;
  readonly onNode: OnEvent<Node[]>;

  constructor(
      context: BootstrapContext,
      request: Request,
  ) {

    const window = context.get(BootstrapWindow);
    const httpFetch = context.get(HttpFetch);
    const mutator = context.get(DomFetchMutator);

    this.onResponse = httpFetch(request);

    const parser: DOMParser = new (window as any).DOMParser();
    const responseTextEmitter = new EventEmitter<[Response, string]>();
    const onDocument: OnEvent<[Document, Response]> = responseTextEmitter.on.thru_(
        (response, text) => nextArgs(parser.parseFromString(text, domResponseType(response)), response),
    );

    this.onNode = onEventBy<[Document, Response]>(receiver => {

      const interest = eventInterest();
      const responseInterest = this.onResponse(response => {

        onDocument(receiver).needs(interest);
        response.text().then(
            text => {
              interest.needs(responseInterest);
              responseTextEmitter.send(response, text);
            },
        ).catch(
            e => interest.off(e),
        );
      });

      return interest;
    }).dig_(
        (document, response) => mutator([document], request, response),
    );
  }

  into(target: Range): EventInterest {
    return this.onNode((...nodes) => {
      target.deleteContents();
      for (let i = nodes.length - 1; i >= 0; --i) {
        target.insertNode(nodes[i]);
      }
    });
  }

}

function domResponseType(response: Response): SupportedType {

  let contentType = response.headers.get('Content-Type') || 'text/html';
  const scIdx = contentType.indexOf(';');

  if (scIdx >= 0) {
    contentType = contentType.substring(0, scIdx);
  }

  return contentType as SupportedType;
}
