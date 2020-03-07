import {
  BootstrapContext,
  ComponentClass,
  ComponentContext,
  ComponentContext__symbol,
  ComponentEvent,
  ElementAdapter,
} from '@wesib/wesib';
import { ValueTracker } from 'fun-events';
import { ComponentNode, ComponentTreeNode, ElementPickMode, ElementNode as ElementNode_ } from './element-node';
import { ElementNodeList } from './element-node-list';
import { elementNodeList } from './element-node-list.impl';
import { NodeAttributes } from './node-attributes.impl';
import { NodeProperties } from './node-properties.impl';

/**
 * @internal
 */
const ElementNode__symbol = (/*#__PURE__*/ Symbol('element-node'));

/**
 * @internal
 */
class ElementNode implements ComponentTreeNode {

  private readonly _attrs: NodeAttributes;
  private readonly _props: NodeProperties;

  constructor(private readonly _bs: BootstrapContext, readonly element: Element) {
    this._attrs = new NodeAttributes(_bs, element);
    this._props = new NodeProperties(element);
    (element as any)[ElementNode__symbol] = this;

    const context = (element as any)[ComponentContext__symbol] as ComponentContext<any> | undefined;

    if (context) {
      this._bind(context);
    } else {
      element.addEventListener('wesib:component', event => this._bind((event as ComponentEvent).context));
    }
  }

  get context(): ComponentContext<any> | undefined {
    return (this.element as any)[ComponentContext__symbol];
  }

  get parent(): ElementNode_ | null {

    const parent = this.element.parentNode;

    return parent && elementNodeOf(this._bs, parent as Element);
  }

  select(selector: string | ComponentClass<any>, mode?: ElementPickMode): ElementNodeList<any> {
    return selectNodes(this._bs, this.element, selector, mode);
  }

  attribute(name: string): ValueTracker<string | null> {
    return this._attrs.get(name);
  }

  property<V>(key: PropertyKey): ValueTracker<V> {
    return this._props.get(key);
  }

  private _bind(context: ComponentContext): void {
    this._props.bind(context);
  }

}

/**
 * @internal
 */
export function elementNodeOf(bsContext: BootstrapContext, element: Element, optional?: boolean): ElementNode_ {

  const existing: ElementNode_ = (element as any)[ElementNode__symbol];

  return (existing || optional) ? existing : new ElementNode(bsContext, element);
}

/**
 * @internal
 */
function selectNodes(
    bsContext: BootstrapContext,
    root: Element,
    selector: string | ComponentClass<any>,
    mode: ElementPickMode = {},
): ElementNodeList<any> {
  if (mode.all) {
    return elementNodeList<ElementNode_>(
        bsContext,
        root,
        selector,
        (element, optional) => elementNodeOf(bsContext, element, optional),
        mode,
    );
  }

  const adapter = bsContext.get(ElementAdapter);

  return elementNodeList<ComponentNode>(
      bsContext,
      root,
      selector,
      (element, optional) => adapter(element) && elementNodeOf(bsContext, element, optional) as ComponentNode,
      mode,
  );
}
