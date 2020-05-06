import { nextArg } from '@proc7ts/call-thru';
import { ContextValueOpts, ContextValues } from '@proc7ts/context-values';
import { contextDestroyed, ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import {
  AfterEvent,
  afterThe,
  EventKeeper,
  EventSender,
  nextAfterEvent,
  OnEvent,
  onSupplied,
} from '@proc7ts/fun-events';

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
        opts => opts.seed.keepThru(
            (...agents) => {
              if (agents.length) {
                return nextArg(combineFetchAgents(agents));
              }

              const defaultProvider = (): AfterEvent<[CombinedFetchAgent<Res>]> => afterThe(defaultFetchAgent);

              return nextAfterEvent(opts.byDefault(defaultProvider) || defaultProvider());
            },
        ),
    );
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          CombinedFetchAgent<Res>,
          EventKeeper<FetchAgent<Res>[]> | FetchAgent<Res>,
          AfterEvent<FetchAgent<Res>[]>>,
  ): CombinedFetchAgent<Res> {

    let delegated: CombinedFetchAgent<Res>;

    opts.context.get(
        this.upKey,
        'or' in opts ? { or: opts.or != null ? afterThe(opts.or) : opts.or } : undefined,
    )!.to(
        agent => delegated = agent,
    ).whenOff(
        reason => delegated = contextDestroyed(reason),
    );

    return (next, request) => delegated(next, request);
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
