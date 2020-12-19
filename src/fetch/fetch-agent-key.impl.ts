import { ContextValueSlot } from '@proc7ts/context-values';
import { contextDestroyed, ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import { AfterEvent, afterThe, digAfter, EventKeeper, EventSender, OnEvent, onSupplied } from '@proc7ts/fun-events';

/**
 * @internal
 */
type FetchAgent<Res extends any[]> = (
    this: void,
    next: (this: void, request?: Request) => OnEvent<Res>,
    request: Request,
) => EventSender<Res>;

/**
 * @internal
 */
type CombinedFetchAgent<Res extends any[]> = (
    this: void,
    next: (this: void, request: Request) => OnEvent<Res>,
    request: Request,
) => OnEvent<Res>;

/**
 * @internal
 */
export class FetchAgentKey<Res extends any[]>
    extends ContextUpKey<CombinedFetchAgent<Res>, FetchAgent<Res>>
    implements ContextUpRef<CombinedFetchAgent<Res>, FetchAgent<Res>> {

  readonly upKey: ContextUpKey.UpKey<CombinedFetchAgent<Res>, FetchAgent<Res>>;

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
          CombinedFetchAgent<Res>,
          EventKeeper<FetchAgent<Res>[]> | FetchAgent<Res>,
          AfterEvent<FetchAgent<Res>[]>>,
  ): void {

    let delegated: CombinedFetchAgent<Res>;

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

/**
 * @internal
 */
function defaultFetchAgent<Res extends any[]>(
    next: (this: void, request: Request) => OnEvent<Res>,
    request: Request,
): OnEvent<Res> {
  return next(request);
}

/**
 * @internal
 */
export function combineFetchAgents<Res extends any[]>(agents: FetchAgent<Res>[]): CombinedFetchAgent<Res> {
  return (next, request) => {

    const fetch: (agentIdx: number, agentRequest: Request) => OnEvent<Res> = (agentIdx, agentRequest) => {

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
