import { ValueTracker } from '@proc7ts/fun-events';
import {
  BootstrapContext,
  ComponentClass,
  ComponentContext,
  ComponentElement,
  ComponentEvent,
  ComponentSlot__symbol,
  ElementAdapter,
} from '@wesib/wesib';
import { ComponentNode, ComponentTreeNode, ElementNode, ElementPickMode } from './element-node';
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
type TreeElement = Element & ComponentElement & {
  [ElementNode__symbol]?: ComponentTreeNode;
};

/**
 * @internal
 */
class ElementNode$ implements ComponentTreeNode {

  private readonly _attrs: NodeAttributes;
  private readonly _props: NodeProperties;

  constructor(private readonly _bs: BootstrapContext, readonly element: TreeElement) {
    this._attrs = new NodeAttributes(_bs, element);
    this._props = new NodeProperties(element);
    element[ElementNode__symbol] = this;

    const context = this.context;

    if (context) {
      this._bind(context);
    } else {
      element.addEventListener('wesib:component', event => this._bind((event as ComponentEvent).context));
    }
  }

  get context(): ComponentContext | undefined {
    return this.element[ComponentSlot__symbol]?.context;
  }

  get parent(): ElementNode | null {

    const parent = this.element.parentNode;

    return parent && elementNodeOf(this._bs, parent as Element);
  }

  select(selector: string | ComponentClass<any>, mode?: ElementPickMode): ElementNodeList<any> {
    return selectNodes(this._bs, this.element, selector, mode);
  }

  attribute(name: string): ValueTracker<string | null> {
    return this._attrs.get(name);
  }

  property<TValue>(key: PropertyKey): ValueTracker<TValue> {
    return this._props.get(key);
  }

  private _bind(context: ComponentContext): void {
    this._props.bind(context);
  }

}

/**
 * @internal
 */
export function elementNodeOf(
    bsContext: BootstrapContext,
    element: TreeElement,
    optional: true,
): ElementNode | undefined;

/**
 * @internal
 */
export function elementNodeOf(
    bsContext: BootstrapContext,
    element: TreeElement,
    optional?: false,
): ElementNode;

/**
 * @internal
 */
export function elementNodeOf(
    bsContext: BootstrapContext,
    element: TreeElement,
    optional?: boolean,
): ElementNode | undefined;


export function elementNodeOf(
    bsContext: BootstrapContext,
    element: TreeElement,
    optional?: boolean,
): ElementNode | undefined {

  const existing = element[ElementNode__symbol];

  return (existing || optional) ? existing : new ElementNode$(bsContext, element);
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
    return elementNodeList<ElementNode>(
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
