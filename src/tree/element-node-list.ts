/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { AIterable, ArrayLikeIterable } from '@proc7ts/a-iterable';
import {
  AfterEvent,
  AfterEvent__symbol,
  EventKeeper,
  EventReceiver,
  EventSender,
  EventSupply,
  OnEvent,
  OnEvent__symbol,
} from '@proc7ts/fun-events';
import { ElementNode } from './element-node';

/**
 * Dynamically updatable list of selected element nodes.
 *
 * It is an iterable of nodes.
 *
 * Implements an `EventSender` interface by sending added and removed nodes arrays.
 *
 * Implements an `EventKeeper` interface by sending updated node list.
 */
export abstract class ElementNodeList<N extends ElementNode = ElementNode>
    extends AIterable<N>
    implements EventSender<[N[], N[]]>, EventKeeper<[ElementNodeList<N>]> {

  /**
   * Builds an `OnEvent` sender of this list changes.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   *
   * @returns An `OnEvent` sender of added an removed node arrays.
   */
  abstract onUpdate(): OnEvent<[N[], N[]]>;

  /**
   * Starts sending this list changes to the given `receiver`
   *
   * @param receiver  Target receiver of added an removed node arrays.
   *
   * @returns List changes supply.
   */
  abstract onUpdate(receiver: EventReceiver<[N[], N[]]>): EventSupply;

  [OnEvent__symbol](): OnEvent<[N[], N[]]> {
    return this.onUpdate();
  }

  /**
   * Builds an `AfterEvent` keeper of current node list.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   *
   * @returns An `AfterEvent` keeper of this list.
   */
  abstract read(): AfterEvent<[ElementNodeList<N>]>;

  /**
   * Starts sending current node list and updates to the given `receiver`.
   *
   * @param receiver  Target receiver of this node list.
   *
   * @returns Node list supply.
   */
  abstract read(receiver: EventReceiver<[ElementNodeList<N>]>): EventSupply;

  [AfterEvent__symbol](): AfterEvent<[ElementNodeList<N>]> {
    return this.read();
  }

  /**
   * Builds an `AfterEvent` keeper of tracked list changes.
   *
   * Sends current nodes immediately upon receiver registration as added ones.
   *
   * @returns An `AfterEvent` sender of iterables of added and removed nodes.
   */
  abstract track(): AfterEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>;

  /**
   * Starts sending tracked list changes to the given `receiver`.
   *
   * Sends current nodes immediately upon receiver registration as added ones.
   *
   * @param receiver  Target receiver of iterables of added and removed nodes.
   *
   * @returns Tracked list changes supply.
   */
  abstract track(receiver: EventReceiver<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>): EventSupply;

  /**
   * Builds an `AfterEvent` keeper of the first node in this list.
   *
   * @returns `AfterEvent` keeper of either the first node, or `undefined` when the list is empty.
   */
  abstract first(): AfterEvent<[N?]>;

  /**
   * Starts sending the first node of this list and updates to the given `receiver`.
   *
   * @param receiver  Target receiver of either the first node, or `undefined` when the list is empty.
   *
   * @returns The first node supply.
   */
  abstract first(receiver: EventReceiver<[N?]>): EventSupply;

}
