import { ComponentContext, ContextValueKey, EventProducer, SingleValueKey } from '@wesib/wesib';
import { ComponentPath } from './component-path';

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
  static readonly key: ContextValueKey<ComponentNode> = new SingleValueKey('component-node');

  /**
   * Component context.
   */
  abstract readonly context: ComponentContext<T>;

  /**
   * Unique path to this component.
   *
   * This is empty when component's element is not connected.
   *
   * The path may change e.g. when component's element is moved in the DOM tree.
   */
  abstract path: ComponentPath.Unique[];

  /**
   * Parent component node, or `null` if the component has no parent.
   *
   * This is `null` when component's element is not connected.
   */
  abstract readonly parent: ComponentNode | null;

  /**
   * Nested component nodes.
   */
  abstract readonly nested: Iterable<ComponentNode>;

  /**
   * Event producer notifying on component node updates. I.e. when parent and/or nested components added or removed.
   */
  abstract readonly on: EventProducer<ComponentNodeListener>;

}

/**
 * Component node listener.
 *
 * @param node An updated component node.
 * @param added Nested component nodes added to this component.
 * @param removed Nested component nodes removed from this component.
 */
export type ComponentNodeListener<T extends object = object> = (
    this: void,
    node: ComponentNode<T>,
    added: Iterable<ComponentNode>,
    removed: Iterable<ComponentNode>) => void;
