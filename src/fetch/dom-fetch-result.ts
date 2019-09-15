/**
 * @module @wesib/generic
 */
import { EventInterest, EventSender, OnEvent, OnEvent__symbol } from 'fun-events';

/**
 * DOM contents fetch result.
 *
 * This is returned from [[DomFetch]] function. The actual fetch would be initiated once event receiver is registered,
 * or contents requested to be inserted to document.
 */
export abstract class DomFetchResult implements EventSender<Node[]> {

  /**
   * An `OnEvent` registrar of parsed DOM nodes contained in the response.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  abstract readonly onNode: OnEvent<Node[]>;

  get [OnEvent__symbol](): OnEvent<Node[]> {
    return this.onNode;
  }

  /**
   * Inserts the requested DOM nodes into the given document range.
   *
   * Replaces the range contents with received DOM nodes.
   *
   * @param target  Document range to insert received DOM nodes into.
   *
   * @returns An event interest that aborts the fetch when lost.
   */
  into(target: Range): EventInterest {
    return this.onNode((...nodes) => {
      target.deleteContents();
      for (let i = nodes.length - 1; i >= 0; --i) {
        target.insertNode(nodes[i]);
      }
    });
  }

}
