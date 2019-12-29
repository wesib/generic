/**
 * @module @wesib/generic
 */
import { ArrayLikeIterable, filterIt, itsEach, mapIt } from 'a-iterable';
import { isPresent } from 'call-thru';
import { afterSupplied, eventSupply, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentNode } from '../tree';
import { ComponentIn } from './component-in';
import { ComponentInReceiver } from './component-in-receiver';

/**
 * Starts receiving user input for the given receiver from the given input control.
 *
 * Searches for the nested components with {@link ComponentIn component input} in their contexts and enables their
 * participation in user input.
 *
 * @param receiver  User input receiver.
 * @param control  User input control.
 *
 * @returns User input supply. The user input is disabled once this supply is cut off.
 */
export function receiveComponentIn(receiver: ComponentInReceiver, control: InControl<any>): EventSupply {

  const inputSupply = eventSupply();
  const { root } = receiver;

  root.context.whenOn(connectionSupply => {
    connectionSupply.needs(inputSupply);

    const map = new Map<ComponentNode, ComponentInNode>();

    root.select('*', { deep: true }).track({
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
          componentIn => afterSupplied(componentIn)({
            supply,
            receive: (_, ...participants) => itsEach(
                participants,
                participant => participant({
                  receiver,
                  control,
                }).needs(supply),
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
  readonly ins: readonly ComponentIn[];
  readonly supply: EventSupply;

}
