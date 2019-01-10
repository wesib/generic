import { AIterable } from 'a-iterable';
import { EventProducer, ValueTracker } from 'fun-events';
import { ComponentNode } from './component-node';

/**
 * Component tree node representing arbitrary element.
 *
 * If element is a component one, the node is implemented by `ComponentNode`. Otherwise it is implemented by this class.
 */
export abstract class ElementNode {

  /**
   * A type of component:
   * - `component` for component node.
   * - `element` for arbitrary element node.
   */
  abstract readonly type: 'element' | 'component';

  /**
   * The element itself.
   */
  abstract readonly element: any;

  /**
   * Parent element node, or `null` if element has no parent.
   */
  abstract readonly parentNode: ElementNode | null;

  /**
   * Select element nodes matching the given selector.
   *
   * @param selector Simple CSS selector of nested components. E.g. component element name.
   * @param opts Element selector options.
   */
  abstract select(
      selector: string,
      opts: ElementNode.ElementSelectorOpts): ElementNodeList;

  /**
   * Select component nodes matching the given selector.
   *
   * @param selector Simple CSS selector of nested components. E.g. component element name.
   * @param opts Component selector options.
   */
  abstract select(
      selector: string,
      opts?: ElementNode.ComponentSelectorOpts): ElementNodeList<ComponentNode<any>>;

  /**
   * Returns a value tracker of element's attribute.
   *
   * @param name Target attribute name.
   *
   * @returns Target attribute's value tracker.
   */
  abstract attribute(name: string): ValueTracker<string | null, string>;

}

export namespace ElementNode {

  /**
   * Element node selector options.
   */
  export interface SelectorOpts {

    /**
     * Set to `true` to select arbitrary nodes. Otherwise - select only component nodes.
     */
    all?: boolean;

    /**
     * Set to `true` to select from entire subtree. Otherwise - select from element child nodes only.
     */
    deep?: boolean;

  }

  /**
   * Component node selector options.
   */
  export interface ComponentSelectorOpts extends SelectorOpts {

    all?: false;

  }

  /**
   * Any element node selector options.
   */
  export interface ElementSelectorOpts extends SelectorOpts {

    /**
     * Set to `true` to select arbitrary nodes. Otherwise - select only component nodes.
     */
    all: true;

  }

}

export abstract class ElementNodeList<N extends ElementNode = ElementNode> extends AIterable<N> {

  abstract readonly onUpdate: EventProducer<[AIterable<N>]>;

}
