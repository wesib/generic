/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import {
  AfterEvent,
  AfterEvent__symbol,
  EventKeeper,
  EventSender,
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
    implements Iterable<N>, EventSender<[N[], N[]]>, EventKeeper<[ElementNodeList<N>]> {

  /**
   * An `OnEvent` sender of this list changes.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  abstract readonly onUpdate: OnEvent<[N[], N[]]>;

  /**
   * An `AfterEvent` keeper of current node list.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  abstract readonly read: AfterEvent<[ElementNodeList<N>]>;

  /**
   * An `AfterEvent` keeper of tracked list changes.
   *
   * Sends current nodes immediately upon receiver registration as added ones.
   */
  abstract readonly track: AfterEvent<[readonly N[], readonly N[]]>;

  /**
   * An `AfterEvent` keeper of either the first node in this list, or `undefined` when the list is empty.
   */
  abstract readonly first: AfterEvent<[N?]>;

  abstract [Symbol.iterator](): Iterator<N>;

  [OnEvent__symbol](): OnEvent<[N[], N[]]> {
    return this.onUpdate;
  }

  [AfterEvent__symbol](): AfterEvent<[ElementNodeList<N>]> {
    return this.read;
  }

}
