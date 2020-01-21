/**
 * @module @wesib/generic
 */
import { ContextUpRef } from 'context-values';
import { EventSender, OnEvent } from 'fun-events';
import { FetchAgentKey } from './fetch-agent-key.impl';

/**
 * HTTP fetch agent signature.
 *
 * The agent can be used to alter [[HttpFetch]] processing. For that it should be registered in appropriate context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by [[HttpFetch]].
 */
export type HttpFetchAgent =
/**
 * @param next  Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
 * Accepts an optional `Request` parameter. The original request will be used instead when omitted.
 * @param request  HTTP request.
 *
 * @returns An `EventSender` of response object(s). It is returned either to preceding agent in chain, or as a result of
 * [[HttpFetch]] call.
 */
    (
        this: void,
        next: (this: void, request?: Request) => OnEvent<[Response]>,
        request: Request,
    ) => EventSender<[Response]>;

export namespace HttpFetchAgent {

  /**
   * Combined HTTP fetch agent signature.
   *
   * This is what is available under [[HttpFetchAgent]] key.
   */
  export type Combined =
  /**
   * @param next  Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
   * Accepts `Request` parameter.
   * @param request  HTTP request.
   *
   * @returns An `OnEvent` registrar of response object(s) receivers. It is returned as a result of [[HttpFetch]] call.
   */
      (
          this: void,
          next: (this: void, request: Request) => OnEvent<[Response]>,
          request: Request,
      ) => OnEvent<[Response]>;

}

/**
 * A key of context value containing an [[HttpFetchAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the fetch.
 */
export const HttpFetchAgent: ContextUpRef<HttpFetchAgent.Combined, HttpFetchAgent> = (
    /*#__PURE__*/ new FetchAgentKey<[Response]>('http-fetch-agent')
);
