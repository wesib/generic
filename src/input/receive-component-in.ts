/**
 * @module @wesib/generic
 */
import { filterIt, itsEach } from 'a-iterable';
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

  root.whenOn(connectionSupply => {
    connectionSupply.needs(inputSupply);

    const rcvNodes = new Set<ComponentNode>();
    const inNodes = new Map<ComponentNode, ComponentInNode>();

    root.get(ComponentNode).select('*', { deep: true }).track({
      supply: connectionSupply,
      receive: (_ctx, added, removed) => {
        itsEach(removed, removeInNode);
        itsEach(added, addInNode);
      },
    });

    function addInNode(node: ComponentNode): ComponentInNode | undefined {

      const { element } = node;
      const nodeRcv = node.context.get(ComponentInReceiver, { or: null });

      if (nodeRcv) {
        // Remove input participants inside new receiver node
        itsEach(
            filterIt(inNodes.keys(), n => element.contains(n.element)),
            removeInNode,
        );
        rcvNodes.add(node);
      }

      const ins = node.context.get(ComponentIn, { or: null });

      if (!ins) {
        return; // New node is not participating in user input
      }

      for (const rcvNode of rcvNodes) {
        if (rcvNode !== node && rcvNode.element.contains(element)) {
          return; // Added node is inside another receiver
        }
      }

      const inNode: ComponentInNode = {
        node,
        ins,
        supply: eventSupply().needs(connectionSupply),
      };

      inNodes.set(node, inNode);
      participate(inNode);

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
      rcvNodes.delete(node);

      const inNode = inNodes.get(node);

      if (inNode) {
        inNodes.delete(node);
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
