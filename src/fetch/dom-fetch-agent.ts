/**
 * @module @wesib/generic
 */
import { ContextUpRef } from 'context-values';
import { EventSender, OnEvent } from 'fun-events';
import { FetchAgentKey } from './fetch-agent-key';

/**
 * DOM contents fetch agent signature.
 *
 * The agent can be used to alter [[DomFetch]] processing. For that it should be registered in appropriate context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by [[DomFetch]].
 */
export type DomFetchAgent =
/**
 * @param next  Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
 * Accepts an optional `Request` parameter. The original request will be used instead when omitted.
 * @param request  HTTP request.
 *
 * @returns An `EventSender` of fetched DOM nodes. It is returned either to preceding agent in chain, or in the
 * {@link DomFetchResult.onNode result} of [[DomFetch]] call.
 */
    (
        this: void,
        next: (this: void, request?: Request) => OnEvent<Node[]>,
        request: Request,
    ) => EventSender<Node[]>;

export namespace DomFetchAgent {

  /**
   * Combined DOM contents fetch agent signature.
   *
   * This is what is available under [[DomFetchAgent]] key.
   */
  export type Combined =
  /**
   * @param next  Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
   * Accepts `Request` parameter.
   * @param request  HTTP request.
   *
   * @returns An `OnEvent` registrar of fetched DOM nodes. It is returned in the {@link DomFetchResult.onNode result}
   * of [[DomFetch]] call.
   */
      (
          this: void,
          next: (this: void, request: Request) => OnEvent<Node[]>,
          request: Request,
      ) => OnEvent<Node[]>;

}

/**
 * A key of context value containing an [[DomFetchAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the fetch.
 */
export const DomFetchAgent: ContextUpRef<DomFetchAgent.Combined, DomFetchAgent> =
    /*#__PURE__*/ new FetchAgentKey<Node[]>('dom-fetch-agent');
