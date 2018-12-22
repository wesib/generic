import { ComponentContext } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventProducer, ValueTracker } from 'fun-events';
import { ElementNode } from './element-node';

/**
 * Component node.
 *
 * Represents a position of the component within component tree.
 *
 * An instance of this class is available in component context under `[ComponentNode.key]`.
 *
 * @param <N> A type of component.
 */
export abstract class ComponentNode<T extends object = object> extends ElementNode {

  /**
   * A key of component context value containing a component node instance.
   */
  static readonly key: ContextKey<ComponentNode<any>> = new SingleContextKey('component-node');

  get type(): 'component' {
    return 'component';
  }

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
