/**
 * @module @wesib/generic
 */
import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, afterEventOf, EventKeeper, OnEvent } from 'fun-events';

/**
 * {@link DomFetch DOM contents fetch} result mutator signature.
 *
 * A mutator can alter a [[DomFetch]] results. For that it should be registered in appropriate context.
 *
 * All registered mutators are organized into chain and called in order of their registration.
 */
export type DomFetchMutator =
/**
 * @param nodes  Received DOM nodes.
 * @param request  HTTP fetch request.
 * @param response  HTTP fetch response.
 *
 * @returns An `OnEvent` registrar of DOM nodes that will be passed to the next mutator in chain, or returned in
 * {@link DomFetchResult.onNode DOM fetch result} if this mutator is the last one in chain.
 */
    (
        this: void,
        nodes: Node[],
        request: Request,
        response: Response,
    ) => OnEvent<Node[]>;

class DomFetchMutatorKey extends ContextUpKey<DomFetchMutator, DomFetchMutator> {

  constructor() {
    super('dom-fetch-mutator');
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          DomFetchMutator,
          EventKeeper<DomFetchMutator[]> | DomFetchMutator,
          AfterEvent<DomFetchMutator[]>>,
  ): DomFetchMutator {

    return (nodes, request, response) => {

      const result = opts.byDefault(() => combinedMutator);

      return result ? result(nodes, request, response) : afterEventOf(...nodes);
    };

    function combinedMutator(
        nodes: Node[],
        request: Request,
        response: Response,
    ): OnEvent<Node[]> {

      let mutators!: DomFetchMutator[];

      opts.seed.once((...sources) => mutators = sources);

      return fetch(0, afterEventOf(...nodes));

      function fetch(
          mutatorIdx: number,
          mutatorNodes: OnEvent<Node[]>,
      ): OnEvent<Node[]> {

        const mutator = mutators[mutatorIdx];

        if (!mutator) {
          return mutatorNodes;
        }

        return mutatorNodes.dig_(
            (...ns) => mutator(ns, request, response),
        );
      }
    }
  }

}

/**
 * A key of context value containing an [[DomFetchMutator]] instance.
 *
 * The mutator returned combines all registered mutators into one. If no mutators registered it does not alter
 * the received DOM nodes.
 */
export const DomFetchMutator: ContextUpRef<DomFetchMutator, DomFetchMutator> =
    /**#__PURE__*/ new DomFetchMutatorKey();
