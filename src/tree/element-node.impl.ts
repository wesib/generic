import { BootstrapContext, ComponentContext, ComponentEvent, ElementAdapter } from '@wesib/wesib';
import { ValueTracker } from 'fun-events';
import { NodeAttributes } from './attribute-tracker';
import { ElementNode as ElementNode_ } from './element-node';
import { ElementNodeList } from './element-node-list.impl';
import { NodeProperties } from './property-tracker';

const NODE_REF = Symbol('element-node');

class ElementNode extends ElementNode_ {

  private readonly _attrs: NodeAttributes;
  private readonly _props: NodeProperties;

  constructor(private readonly _bs: BootstrapContext, readonly element: Element) {
    super();
    this._attrs = new NodeAttributes(_bs, element);
    this._props = new NodeProperties(element);
    (element as any)[NODE_REF] = this;

    const context = (element as any)[ComponentContext.symbol] as ComponentContext<any> | undefined;

    if (context) {
      this._bind(context);
    } else {
      element.addEventListener('wesib:component', event => this._bind((event as ComponentEvent).context));
    }
  }

  get context(): ComponentContext<any> | undefined {
    return (this.element as any)[ComponentContext.symbol];
  }

  get parent() {

    const parent = this.element.parentElement;

    return parent != null ? elementNodeOf(this._bs, parent) : null;
  }

  select(selector: string, opts?: ElementNode_.SelectorOpts): ElementNodeList<any> {
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

export function elementNodeOf(bs: BootstrapContext, element: Element, optional?: boolean): ElementNode_.Any {

  const found: ElementNode_.Any = (element as any)[NODE_REF];

  if (optional || found) {
    return found;
  }

  return new ElementNode(bs, element) as ElementNode_.Raw;
}

function selectNodes(
    bs: BootstrapContext,
    root: Element,
    selector: string,
    opts: ElementNode_.SelectorOpts = {}): ElementNodeList<any> {

  const adapter = bs.get(ElementAdapter);

  if (opts.all) {
    return new ElementNodeList<ElementNode_.Any>(
        bs,
        root,
        selector,
        (element, optional) => elementNodeOf(bs, element, optional),
        opts);
  }
  return new ElementNodeList<ElementNode_.Component<any>>(
      bs,
      root,
      selector,
      (element, optional) => {
        if (adapter(element)) {
          return elementNodeOf(bs, element, optional) as ElementNode_.Component<any>;
        }
        return undefined;
      },
      opts);
}
