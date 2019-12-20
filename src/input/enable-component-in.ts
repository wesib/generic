/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { ArrayLikeIterable, filterIt, itsEach, mapIt } from 'a-iterable';
import { isPresent } from 'call-thru';
import { afterSupplied, EventKeeper, eventSupply, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentNode } from '../tree';
import { ComponentIn } from './component-in';

/**
 * Enables user input in the given component input context.
 *
 * Searches for the nested components with {@link ComponentIn component input} in their contexts and enables their
 * participation in user input.
 *
 * Requires [[ComponentTreeSupport]] feature in order to operate.
 *
 * @param context  A context of component initiating the user input.
 * @param control  User input control.
 *
 * @returns User input supply. The user input is disabled once this supply is cut off.
 */
export function enableComponentIn(
    {
      context,
      control,
    }: {
      context: ComponentContext;
      control: InControl<any>;
    },
): EventSupply {

  const inputSupply = eventSupply();
  const inputNode = context.get(ComponentNode);

  context.whenOn(connectionSupply => {
    connectionSupply.needs(inputSupply);

    const map = new Map<ComponentNode, ComponentInNode>();

    inputNode.select('*', { deep: true }).track({
      supply: connectionSupply,
      receive: (_ctx, added, removed) => {
        itsEach(removed, removeInNode);
        itsEach(addedInNodes(added), participate);
      },
    });

    function addedInNodes(nodes: ArrayLikeIterable<ComponentNode>): Iterable<ComponentInNode> {
      return filterIt<ComponentInNode | undefined, ComponentInNode>(
          mapIt(
              nodes,
              toInNode,
          ),
          isPresent,
      );
    }

    function toInNode(node: ComponentNode): ComponentInNode | undefined {

      const ins = node.context.get(ComponentIn, { or: null });

      if (!ins) {
        return;
      }

      const { element } = node;

      for (const n of map.keys()) {
        if (element.contains(n.element)) {
          removeInNode(n);
        } else if (n.element.contains(element)) {
          return;
        }
      }

      const inNode: ComponentInNode = {
        node,
        ins,
        supply: eventSupply().needs(connectionSupply),
      };

      map.set(node, inNode);

      return inNode;
    }

    function participate({ ins, supply: inSupply }: ComponentInNode) {

      const supply = eventSupply().needs(inSupply);

      itsEach(
          ins,
          participantsSupplier => afterSupplied(participantsSupplier)({
            supply,
            receive: (_, ...participants) => itsEach(
                participants,
                participant => participant({
                  componentContext: context,
                  control,
                  supply,
                }),
            ),
          }),
      );
    }

    function removeInNode(node: ComponentNode) {

      const inNode = map.get(node);

      if (inNode) {
        map.delete(node);
        inNode.supply.off();
      }
    }
  }).needs(inputSupply);

  return inputSupply;
}

interface ComponentInNode {

  readonly node: ComponentNode;
  readonly ins: readonly EventKeeper<ComponentIn[]>[];
  readonly supply: EventSupply;

}
