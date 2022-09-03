import { CxEntry } from '@proc7ts/context-values';
import { EventSender, OnEvent } from '@proc7ts/fun-events';
import { cxFetchAgent } from './fetch-agent.entry';

/**
 * HTTP fetch agent signature.
 *
 * The agent can be used to alter {@link HttpFetch} processing. For that it should be registered in appropriate context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by {@link HttpFetch}.
 *
 * @param next - Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
 * Accepts an optional `Request` parameter. The original request will be used instead when omitted.
 * @param request - HTTP request.
 *
 * @returns An `EventSender` of response object(s). It is returned either to preceding agent in chain, or as a result of
 * {@link HttpFetch} call.
 */
export type HttpFetchAgent = (
  this: void,
  next: (this: void, request?: Request) => OnEvent<[Response]>,
  request: Request,
) => EventSender<[Response]>;

export namespace HttpFetchAgent {
  /**
   * Combined HTTP fetch agent signature.
   *
   * This is what is available under {@link HttpFetchAgent} key.
   *
   * @param next - Either calls the next agent in chain, or actually fetches the data if this agent is the last one.
   * Accepts `Request` parameter.
   * @param request - HTTP request.
   *
   * @returns An `OnEvent` sender of response object(s) receivers. It is returned as a result of {@link HttpFetch} call.
   */
  export type Combined = (
    this: void,
    next: (this: void, request: Request) => OnEvent<[Response]>,
    request: Request,
  ) => OnEvent<[Response]>;
}

/**
 * Context entry containing an {@link HttpFetchAgent} instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the fetch.
 */
export const HttpFetchAgent: CxEntry<HttpFetchAgent.Combined, HttpFetchAgent> = {
  perContext: /*#__PURE__*/ cxFetchAgent(),
  toString: () => '[HttpFetchAgent]',
};
