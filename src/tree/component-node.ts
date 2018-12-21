import { ComponentContext } from '@wesib/wesib';
import { AIterable } from 'a-iterable';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventProducer } from 'fun-events';
import { ValueTracker } from '../common';

/**
 * Component node.
 *
 * Represents a position of the component within component tree.
 *
 * An instance of this class is available in component context under `[ComponentNode.key]`.
 *
 * @param <T> A type of component.
 */
export abstract class ComponentNode<T extends object = object> {

  /**
   * A key of component context value containing a component node instance.
   */
  static readonly key: ContextKey<ComponentNode<any>> = new SingleContextKey('component-node');

  /**
   * Component context.
   */
  abstract readonly context: ComponentContext<T>;

  /**
   * Parent component node, or `null` if the component has no parent.
   *
   * This is `null` when component's element is not connected.
   */
  abstract readonly parent: ComponentNode | null;

  /**
   * Event producer notifying on parent node updates. I.e. when parent component changed.
   */
  abstract readonly onParentUpdate: EventProducer<(this: void, parent: ComponentNode | null) => void>;

  /**
   * Select nested component nodes matching the given selector.
   *
   * @param selector Simple CSS selector of nested components. E.g. component element name.
   * @param opts Selector options.
   */
  abstract select<N extends object = object>(
      selector: string,
      opts?: ComponentNode.SelectorOpts): ComponentNodeList<N>;

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

  /**
   * Returns a value tracker of element's attribute.
   *
   * @param name Target attribute name.
   *
   * @returns Target attribute's value tracker.
   */
  abstract attribute(name: string): ValueTracker<string | null, string>;

}

export namespace ComponentNode {

  /**
   * Component node selector options.
   */
  export interface SelectorOpts {

    /**
     * Set to `true` to select from entire subtree. Otherwise - select from component child nodes only.
     */
    deep?: boolean;

  }

}

export abstract class ComponentNodeList<T extends object> extends AIterable<ComponentNode<T>> {

  abstract readonly onUpdate: EventProducer<(this: void, list: AIterable<ComponentNode<T>>) => void>;

}
