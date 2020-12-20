/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { SingleContextKey, SingleContextRef } from '@proc7ts/context-values';
import { ValueTracker } from '@proc7ts/fun-events';
import { BootstrapContext, ComponentClass, ComponentContext } from '@wesib/wesib';
import { ElementNodeList } from './element-node-list';
import { elementNodeOf } from './element-node.impl';

/**
 * Arbitrary element node within component tree. Either bound to some component or not.
 */
export type ElementNode =
    | RawElementNode
    | ComponentNode;

/**
 * Component tree node representing arbitrary element.
 *
 * This is a base interface of all element node implementations.
 */
export interface ComponentTreeNode {

  /**
   * The element itself.
   */
  readonly element: any;

  /**
   * A context of component bound to this element, if any.
   */
  readonly context?: ComponentContext<any>;

  /**
   * Parent element node, or `null` if element has no parent.
   */
  readonly parent: ElementNode | null;

  /**
   * Selects component nodes matching the given selector.
   *
   * @param selector - Simple CSS selector of nested components.
   * @param mode - Component nodes pick mode.
   *
   * @returns Dynamically updatable list of matching component nodes.
   */
  select(
      selector: string,
      mode?: ComponentPickMode,
  ): ElementNodeList<ComponentNode>;

  /**
   * Selects component nodes of the given type.
   *
   * @param componentType - Nested component type with custom element name.
   * @param mode - Component nodes pick mode.
   *
   * @returns Dynamically updatable list of matching component nodes.
   */
  select<T extends object>(
      componentType: ComponentClass<T>,
      mode?: ComponentPickMode,
  ): ElementNodeList<ComponentNode<T>>;

  /**
   * Selects element nodes matching the given selector.
   *
   * @param selector - Simple CSS selector of nested elements. E.g. CSS class selector.
   * @param mode - A mode of node picking from component tree.
   *
   * @returns Dynamically updatable list of matching element nodes.
   */
  select(
      selector: string,
      mode: ElementPickMode,
  ): ElementNodeList;

  /**
   * Tracks element attribute.
   *
   * `null` attribute value corresponds to its absence. Setting it to `null` removes attribute.
   *
   * @param name - Target attribute name.
   *
   * @returns Target attribute's value tracker.
   */
  attribute(name: string): ValueTracker<string | null>;

  /**
   * Tracks element element property.
   *
   * The changes are tracked with `StateTracker`. So it is expected that the target property notifies on its changes
   * with state updater. E.g. when it is defined by `@DomProperty` decorator.
   *
   * @typeParam TValue - Property value type.
   * @param key - Target property key.
   *
   * @returns Target property's value tracker.
   */
  property<TValue>(key: PropertyKey): ValueTracker<TValue>;

}

/**
 * Element node representing raw element not bound to any component.
 */
export interface RawElementNode extends ComponentTreeNode {

  readonly context?: undefined;

}

/**
 * Element node representing an element bound to some component.
 */
export interface ComponentNode<T extends object = any> extends ComponentTreeNode {

  readonly context: ComponentContext<T>;

}

/**
 * A key of component context value containing a component node instance.
 */
export const ComponentNode: SingleContextRef<ComponentNode> = (
    /*#__PURE__*/ new SingleContextKey<ComponentNode>(
        'component-node',
        {
          byDefault(context) {
            return elementNodeOf(
                context.get(BootstrapContext),
                context.get(ComponentContext).element,
            ) as ComponentNode;
          },
        },
    )
);

/**
 * A mode of node picking from component tree.
 */
export interface ElementPickMode {

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
 * A mode that picks component nodes from component tree.
 */
export interface ComponentPickMode extends ElementPickMode {

  all?: false;

}
