/**
 * @module @wesib/generic
 */
import { ContextUpRef } from 'context-values';
import { EventSender, OnEvent } from 'fun-events';
import { FetchAgentKey } from '../../fetch/fetch-agent-key';

/**
 * Page load agent signature.
 *
 * The agent can be used to alter loaded page document processing. For that it should be registered in appropriate
 * context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by page loader.
 */
export type PageLoadAgent =
/**
 * @param next  Either calls the next agent in chain, or actually loads page document if this agent is the last one.
 * Accepts an optional `Request` parameter. The original request will be used instead when omitted.
 * @param request  HTTP request.
 *
 * @returns An `EventSender` of loaded document. It is returned either to preceding agent in chain, or as a loaded
 * document.
 */
    (
        this: void,
        next: (this: void, request?: Request) => OnEvent<[Document]>,
        request: Request,
    ) => EventSender<[Document]>;

export namespace PageLoadAgent {

  /**
   * Combined page load agent signature.
   *
   * This is what is available under [[PageLoadAgent]] key.
   */
  export type Combined =
  /**
   * @param next  Either calls the next agent in chain, or actually loads page document if this agent is the last one.
   * Accepts `Request` parameter.
   * @param request  HTTP request.
   *
   * @returns An `OnEvent` registrar of loaded document.
   */
      (
          this: void,
          next: (this: void, request: Request) => OnEvent<[Document]>,
          request: Request,
      ) => OnEvent<[Document]>;

}

/**
 * A key of context value containing an [[DomFetchAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the fetch.
 */
export const PageLoadAgent: ContextUpRef<PageLoadAgent.Combined, PageLoadAgent> =
    /*#__PURE__*/ new FetchAgentKey<[Document]>('page-load-agent');
