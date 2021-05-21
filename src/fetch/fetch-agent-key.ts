import { ContextValueSlot } from '@proc7ts/context-values';
import { contextDestroyed, ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import { AfterEvent, afterThe, digAfter, EventSender, OnEvent, onSupplied } from '@proc7ts/fun-events';

export type FetchAgent<TResponse extends any[]> = (
    this: void,
    next: (this: void, request?: Request) => OnEvent<TResponse>,
    request: Request,
) => EventSender<TResponse>;

export type CombinedFetchAgent<TResponse extends any[]> = (
    this: void,
    next: (this: void, request: Request) => OnEvent<TResponse>,
    request: Request,
) => OnEvent<TResponse>;

export class FetchAgentKey<TResponse extends any[]>
    extends ContextUpKey<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>>
    implements ContextUpRef<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>> {

  readonly upKey: ContextUpKey.UpKey<CombinedFetchAgent<TResponse>, FetchAgent<TResponse>>;

  constructor(name: string) {
    super(name);
    this.upKey = this.createUpKey(
        slot => slot.insert(slot.seed.do(digAfter(
            (...agents) => {
              if (agents.length) {
                return afterThe(combineFetchAgents(agents));
              }
              if (slot.hasFallback && slot.or) {
                return slot.or;
              }

              return afterThe(defaultFetchAgent);
            },
        ))),
    );
  }

  grow(
      slot: ContextValueSlot<
          CombinedFetchAgent<TResponse>,
          ContextUpKey.Source<FetchAgent<TResponse>>,
          AfterEvent<FetchAgent<TResponse>[]>>,
  ): void {

    let delegated: CombinedFetchAgent<TResponse>;

    slot.context.get(
        this.upKey,
        slot.hasFallback ? { or: slot.or != null ? afterThe(slot.or) : slot.or } : undefined,
    )!(
        agent => delegated = agent,
    ).whenOff(
        reason => delegated = contextDestroyed(reason),
    );

    slot.insert((next, request) => delegated(next, request));
  }

}

function defaultFetchAgent<TResponse extends any[]>(
    next: (this: void, request: Request) => OnEvent<TResponse>,
    request: Request,
): OnEvent<TResponse> {
  return next(request);
}

function combineFetchAgents<TResponse extends any[]>(
    agents: FetchAgent<TResponse>[],
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
