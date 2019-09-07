/**
 * @module @wesib/wesib
 */
import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, EventKeeper, EventSender, OnEvent, onEventFrom } from 'fun-events';

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
 * Accepts the same parameters as [[HttpFetch]]. The corresponding parameter will be used instead when either of them
 * is omitted.
 * @param input  The resource to fetch. This can either an URL string, or a `Request` object.
 * @param init  Custom settings to apply to the request.
 *
 * @returns An `EventSender` of response object(s). It is returned either to preceding agent in chain, or as a result of
 * [[HttpFetch]] call.
 */
    (
        this: void,
        next: (this: void, input?: RequestInfo, init?: RequestInit) => OnEvent<[Response]>,
        input: RequestInfo,
        init?: RequestInit,
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
   * Accepts the same parameters as [[HttpFetch]].
   * @param input  The resource to fetch. This can either an URL string, or a `Request` object.
   * @param init  Custom settings to apply to the request.
   *
   * @returns An `OnEvent` registrar of response object(s) receivers. It is returned as a result of [[HttpFetch]] call.
   */
      (
          this: void,
          next: (this: void, input: RequestInfo, init?: RequestInit) => OnEvent<[Response]>,
          input: RequestInfo,
          init?: RequestInit,
      ) => OnEvent<[Response]>;

}

class HttpFetchAgentKey extends ContextUpKey<HttpFetchAgent.Combined, HttpFetchAgent>
    implements ContextUpRef<HttpFetchAgent.Combined, HttpFetchAgent, AfterEvent<HttpFetchAgent[]>> {

  constructor() {
    super('http-fetch-agent');
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          HttpFetchAgent.Combined,
          EventKeeper<HttpFetchAgent[]> | HttpFetchAgent,
          AfterEvent<HttpFetchAgent[]>>,
  ): HttpFetchAgent.Combined {
    return (next, input, info) => {

      const result = opts.byDefault(() => combinedAgent);

      return result ? result(next, input, info) : next(input, info);
    };

    function combinedAgent(
        next: (this: void, input: RequestInfo, init?: RequestInit) => OnEvent<[Response]>,
        input: RequestInfo,
        init?: RequestInit,
    ): OnEvent<[Response]> {

      let agents!: HttpFetchAgent[];

      opts.seed.once((...sources) => agents = sources);

      return fetch(0, input, init);

      function fetch(
          agentIdx: number,
          agentInput: RequestInfo,
          agentInit: RequestInit | undefined,
      ): OnEvent<[Response]> {

        const agent = agents[agentIdx];

        if (!agent) {
          return next(agentInput, agentInit);
        }

        return onEventFrom(
            agent(
                (
                    nextInput = agentInput,
                    nextInit = agentInit,
                ) => fetch(agentIdx + 1, nextInput, nextInit),
                agentInput,
                agentInit,
            )
        );
      }
    }
  }

}

/**
 * A key of context value containing an [[HttpFetchAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the fetch.
 */
export const HttpFetchAgent: ContextUpRef<HttpFetchAgent.Combined, HttpFetchAgent> =
    /**#__PURE__*/ new HttpFetchAgentKey();
