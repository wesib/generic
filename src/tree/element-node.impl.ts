import {
  BootstrapContext,
  ComponentClass,
  ComponentContext,
  ComponentContext__symbol,
  ComponentEvent,
  ElementAdapter,
} from '@wesib/wesib';
import { ValueTracker } from 'fun-events';
import { ComponentNode, ElementNode as ElementNode_, ElementNodeList } from './element-node';
import { elementNodeList } from './element-node-list.impl';
import { NodeAttributes } from './node-attributes.impl';
import { NodeProperties } from './node-properties.impl';

const ElementNode__symbol = /*#__PURE__*/ Symbol('element-node');

class ElementNode extends ElementNode_ {

  private readonly _attrs: NodeAttributes;
  private readonly _props: NodeProperties;

  constructor(private readonly _bs: BootstrapContext, readonly element: Element) {
    super();
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

  get parent() {

    const parent = this.element.parentElement;

    return parent != null ? elementNodeOf(this._bs, parent) : null;
  }

  select(selector: string | ComponentClass<any>, opts?: ElementNode_.SelectorOpts): ElementNodeList<any> {
    return selectNodes(this._bs, this.element, selector, opts);
  }

  attribute(name: string): ValueTracker<string | null, string> {
    return this._attrs.get(name);
  }

  property<V>(key: PropertyKey): ValueTracker<V> {
    return this._props.get(key);
  }

  private _bind(context: ComponentContext) {
    this._props.bind(context);
  }

}

/**
 * @internal
 */
export function elementNodeOf(bs: BootstrapContext, element: Element, optional?: boolean): ElementNode_.Any {

  const found: ElementNode_.Any = (element as any)[ElementNode__symbol];

  if (optional || found) {
    return found;
  }

  return new ElementNode(bs, element) as ElementNode_.Raw;
}

function selectNodes(
    bs: BootstrapContext,
    root: Element,
    selector: string | ComponentClass<any>,
    opts: ElementNode_.SelectorOpts = {},
): ElementNodeList<any> {

  const adapter = bs.get(ElementAdapter);

  if (opts.all) {
    return elementNodeList<ElementNode_.Any>(
        bs,
        root,
        selector,
        (element, optional) => elementNodeOf(bs, element, optional),
        opts,
    );
  }
  return elementNodeList<ComponentNode<any>>(
      bs,
      root,
      selector,
      (element, optional) => {
        if (adapter(element)) {
          return elementNodeOf(bs, element, optional) as ComponentNode<any>;
        }
        return undefined;
      },
      opts,
  );
}
