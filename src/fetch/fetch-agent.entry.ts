import { cxDynamic, CxEntry } from '@proc7ts/context-values';
import { EventSender, OnEvent, onSupplied } from '@proc7ts/fun-events';

export type FetchAgent<TResponse extends unknown[]> = (
    this: void,
    next: (this: void, request?: Request) => OnEvent<TResponse>,
    request: Request,
) => EventSender<TResponse>;

export type CombinedFetchAgent<TResponse extends unknown[]> = (
    this: void,
    next: (this: void, request: Request) => OnEvent<TResponse>,
    request: Request,
) => OnEvent<TResponse>;

export function cxFetchAgent<TResponse extends unknown[]>():
    CxEntry.Definer<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>> {
  return cxDynamic<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>, CombinedFetchAgent<TResponse>>({
    create: FetchAgent$combine,
    byDefault: _ => FetchAgent$default,
    access: get => () => (next, request) => get()(next, request),
  });
}

function FetchAgent$default<TResponse extends any[]>(
    next: (this: void, request: Request) => OnEvent<TResponse>,
    request: Request,
): OnEvent<TResponse> {
  return next(request);
}

function FetchAgent$combine<TResponse extends any[]>(
    agents: FetchAgent<TResponse>[],
    _target: CxEntry.Target<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>>,
): CombinedFetchAgent<TResponse> {
  return (next, request) => {

    const fetch: (agentIdx: number, agentRequest: Request) => OnEvent<TResponse> = (
        agentIdx,
        agentRequest,
    ) => {

      const agent = agents[agentIdx];

      if (!agent) {
        return next(agentRequest);
      }

      return onSupplied(
          agent(
              (nextRequest = agentRequest) => fetch(agentIdx + 1, nextRequest),
              agentRequest,
          ),
      );
    };

    return fetch(0, request);
  };
}
