import { ComponentContext } from '@wesib/wesib';
import { AIterable } from 'a-iterable';
import { ContextKey, SingleContextKey } from 'context-values';
import {
  EventProducer,
  ValueTracker,
  EventSource,
  CachedEventSource,
  onEventKey,
  afterEventKey,
  CachedEventProducer,
} from 'fun-events';

/**
 * Component tree node representing arbitrary element.
 */
export abstract class ElementNode {

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
      opts?: ElementNode.ComponentSelectorOpts): ElementNodeList<ComponentNode>;

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
   * Any element node. Either bound to some component or not.
   */
  export type Any = Raw | ComponentNode;

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

/**
 * Element node representing an element bound to some component.
 */
export interface ComponentNode<T extends object = object> extends ElementNode {

  readonly context: ComponentContext<T>;

}

const KEY = /*#__PURE__*/ new SingleContextKey<ComponentNode>('component-node');

export const ComponentNode = {

  /**
   * A key of component context value containing a component node instance.
   */
  get key(): ContextKey<ComponentNode> {
    return KEY;
  }

};

export abstract class ElementNodeList<N extends ElementNode = ElementNode.Any>
    extends AIterable<N>
    implements EventSource<[AIterable<N>]>, CachedEventSource<[AIterable<N>]> {

  abstract readonly onUpdate: EventProducer<[AIterable<N>]>;

  get [onEventKey](): EventProducer<[AIterable<N>]> {
    return this.onUpdate;
  }

  readonly [afterEventKey]: CachedEventProducer<[AIterable<N>]> =
      CachedEventProducer.from<[AIterable<N>]>(this, () => [this]);

}
