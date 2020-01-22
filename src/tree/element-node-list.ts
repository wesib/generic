/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { AIterable, ArrayLikeIterable } from 'a-iterable';
import { AfterEvent, AfterEvent__symbol, EventKeeper, EventSender, OnEvent, OnEvent__symbol } from 'fun-events';
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
   * An `OnEvent` sender of list changes. Sends arrays of added and removed nodes.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  abstract readonly onUpdate: OnEvent<[N[], N[]]>;

  get [OnEvent__symbol](): OnEvent<[N[], N[]]> {
    return this.onUpdate;
  }

  /**
   * An `AfterEvent` keeper of current node list.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  abstract readonly read: AfterEvent<[ElementNodeList<N>]>;

  get [AfterEvent__symbol](): AfterEvent<[ElementNodeList<N>]> {
    return this.read;
  }

  /**
   * An `AfterEvent` keeper of node list changes.
   *
   * Sends an iterables of added and removed nodes. Sends current nodes immediately upon receiver registration.
   */
  abstract readonly track: AfterEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>;

  /**
   * An `AfterEvent` keeper of the first node in this list.
   */
  abstract readonly first: AfterEvent<[N?]>;

}
