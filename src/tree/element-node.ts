import { ComponentContext } from '@wesib/wesib';
import { AIterable } from 'a-iterable';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventProducer, ValueTracker } from 'fun-events';

/**
 * Component tree node representing arbitrary element.
 */
export abstract class ElementNode {

  /**
   * A key of component context value containing an element node instance.
   */
  static readonly key: ContextKey<ElementNode.Component> = new SingleContextKey('element-node');

  /**
   * The element itself.
   */
  abstract readonly element: any;

  /**
   * A context of component bound to this element, if any.
   */
  abstract readonly context?: ComponentContext<any>;

  /**
   * Parent element node, or `null` if element has no parent.
   */
  abstract readonly parent: ElementNode | null;

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
      opts?: ElementNode.ComponentSelectorOpts): ElementNodeList<ElementNode.Component<any>>;

  /**
   * Returns a value tracker of element's attribute.
   *
   * @param name Target attribute name.
   *
   * @returns Target attribute's value tracker.
   */
  abstract attribute(name: string): ValueTracker<string | null, string>;

  /**
   * Returns a value tracker of element's property.
   *
   * The changes are tracked with `StateTracker`. So it is expected that the target property notifies on its changes
   * with state updater. E.g. when it is defined by `@DomProperty` decorator.
   *
   * @param key Target property key.
   *
   * @returns Target property's value tracker.
   */
  abstract property<V>(key: PropertyKey): ValueTracker<V>;

}

export namespace ElementNode {

  /**
   * Element node representing raw element no bound to any component.
   */
  export interface Raw extends ElementNode {

    readonly context?: undefined;

  }

  /**
   * Element node representing an element bound to some component.
   */
  export interface Component<T extends object = object> extends ElementNode {

    readonly context: ComponentContext<T>;

  }

  /**
   * Any element node. Either bound to some component or not.
   */
  export type Any = Raw | Component<any>;

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
