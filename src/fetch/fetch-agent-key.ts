import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, EventKeeper, EventSender, OnEvent, onEventFrom } from 'fun-events';

type FetchAgent<Res extends any[]> = (
    this: void,
    next: (this: void, request?: Request) => OnEvent<Res>,
    request: Request,
) => EventSender<Res>;

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
    implements ContextUpRef<CombinedFetchAgent<Res>, FetchAgent<Res>, AfterEvent<FetchAgent<Res>[]>> {

  constructor(name: string) {
    super(name);
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          CombinedFetchAgent<Res>,
          EventKeeper<FetchAgent<Res>[]> | FetchAgent<Res>,
          AfterEvent<FetchAgent<Res>[]>>,
  ): CombinedFetchAgent<Res> {
    return (next, request) => {

      const result = opts.byDefault(() => combinedAgent);

      return result ? result(next, request) : next(request);
    };

    function combinedAgent(
        next: (this: void, request: Request) => OnEvent<Res>,
        request: Request,
    ): OnEvent<Res> {

      let agents!: FetchAgent<Res>[];

      opts.seed.once((...sources) => agents = sources);

      return fetch(0, request);

      function fetch(agentIdx: number, agentRequest: Request): OnEvent<Res> {

        const agent = agents[agentIdx];

        if (!agent) {
          return next(agentRequest);
        }

        return onEventFrom(
            agent(
                (nextRequest = agentRequest) => fetch(agentIdx + 1, nextRequest),
                agentRequest,
            )
        );
      }
    }
  }

}
