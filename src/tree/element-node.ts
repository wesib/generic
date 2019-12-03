/**
 * @module @wesib/generic
 */
import { ComponentContext } from '@wesib/wesib';
import { AIterable, ArrayLikeIterable } from 'a-iterable';
import { SingleContextKey, SingleContextRef } from 'context-values';
import {
  AfterEvent,
  AfterEvent__symbol,
  EventKeeper,
  EventSender,
  OnEvent,
  OnEvent__symbol,
  ValueTracker,
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
   * @param selector  Simple CSS selector of nested components. E.g. component element name.
   * @param opts  Element selector options.
   */
  abstract select(
      selector: string,
      opts: ElementNode.ElementSelectorOpts,
  ): ElementNodeList;

  /**
   * Select component nodes matching the given selector.
   *
   * @param selector  Simple CSS selector of nested components. E.g. component element name.
   * @param opts  Component selector options.
   */
  abstract select(
      selector: string,
      opts?: ElementNode.ComponentSelectorOpts,
  ): ElementNodeList<ComponentNode>;

  /**
   * Returns a value tracker of element's attribute.
   *
   * @param name  Target attribute name.
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
   * @param key  Target property key.
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

/**
 * A key of component context value containing a component node instance.
 */
export const ComponentNode: SingleContextRef<ComponentNode> =
    /*#__PURE__*/ new SingleContextKey<ComponentNode>('component-node');

/**
 * Dynamic list of selected component tree nodes.
 *
 * It is an iterable of nodes.
 *
 * Implements an `EventSender` interface by sending added and removed nodes arrays.
 *
 * Implements an `EventKeeper` interface by sending updated node list.
 */
export abstract class ElementNodeList<N extends ElementNode = ElementNode.Any>
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
