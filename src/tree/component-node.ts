import { ComponentContext, ContextValueKey, EventEmitter, EventProducer, SingleValueKey } from '@wesib/wesib';

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
  static readonly key: ContextValueKey<ComponentNode<any>> = new SingleValueKey('component-node');

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
   * Event producer notifying on parent node updates. I.e. when parent components changed.
   */
  abstract readonly onParentUpdate: EventProducer<(this: void, parent: ComponentNode | null) => void>;

  /**
   * Select nested component nodes matching the given selector.
   *
   * @param selector Simple CSS selector of nested components. E.g. component element name.
   * @param subtree Set to `true` to select from entire subtree. Otherwise - select from component child nodes only.
   */
  abstract select<N extends object = object>(
      selector: string,
      { subtree }?: { subtree?: boolean }): ComponentNodeList<N>;

}

export interface ComponentNodeList<T extends object> extends Iterable<ComponentNode<T>> {

  readonly onUpdate: EventProducer<(this: void, list: ComponentNode<T>[]) => void>;

  readonly all: ComponentNode<T>[];

}
