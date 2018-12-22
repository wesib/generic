import { BootstrapWindow, ComponentContext } from '@wesib/wesib';
import { AIterable, itsIterator, overArray } from 'a-iterable';
import { ContextValues, SingleContextKey } from 'context-values';
import { EventEmitter, EventProducer, ValueTracker } from 'fun-events';
import { NodeAttributes } from './attribute-tracker';
import { ComponentNode as ComponentNode_ } from './component-node';
import { ElementNode as ElementNode_, ElementNodeList } from './element-node';
import { NodeProperties } from './property-tracker';

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

abstract class DynamicNodeList<N extends ElementNode_> extends ElementNodeList<N> {

  readonly onUpdate = EventProducer.of<(this: void, list: AIterable<N>) => void>(listener => {

      const firstConsumer = !this._updates.consumers;
      const interest = this._updates.on(listener);

      if (firstConsumer) {
        this._refresh();
        this._observer.observe(this._element, this._init);
      }

      return {
        off: () => {
          interest.off();
          if (!this._updates.consumers) {
            this._observer.disconnect();
          }
        },
      };
    });

  private readonly _observer: MutationObserver;
  private _all: Set<N> = new Set();
  private readonly _updates = new EventEmitter<(this: void, list: AIterable<N>) => void>();
  private readonly _init: MutationObserverInit;

  protected constructor(
      context: ContextValues,
      private readonly _element: any,
      private readonly _selector: string,
      { deep }: ElementNode_.SelectorOpts) {
    super();
    this._init = deep ? WATCH_DEEP : WATCH_CHILD_LIST;

    const Observer: typeof MutationObserver = (context.get(BootstrapWindow) as any).MutationObserver;

    this._observer = new Observer(mutations => this._update(mutations));
  }

  [Symbol.iterator]() {
    return itsIterator(this.all);
  }

  get all(): Set<N> {
    if (this._updates.consumers) {
      return this._all;
    }
    return this._refresh();
  }

  private _refresh(): Set<N> {
    return this._all = new Set<N>(this._request());
  }

  private _request(): AIterable<N> {

    const element: HTMLElement = this._element;
    let iter: AIterable<Element>;

    if (this._init.subtree) {
      iter = AIterable.from(overArray(element.querySelectorAll(this._selector)));
    } else {
      iter = AIterable.from(overArray(element.children))
          .filter(item => item.matches(this._selector));
    }

    return iter.map<N | undefined>(node => this.nodeOf(node))
            .filter<N>(isPresent);
  }

  private _update(mutations: MutationRecord[]) {

    let updated = false;

    mutations.forEach(mutation => {
      AIterable.from(overArray(mutation.addedNodes))
          .forEach(added => {

            const node = this.nodeOf(added);

            if (node && !this._all.has(node)) {
              this._all.add(node);
              updated = true;
            }
          });
      AIterable.from(overArray(mutation.removedNodes))
          .forEach(removed => {

            const node = this.nodeOf(removed);

            if (node && this._all.has(node)) {
              this._all.delete(node);
              updated = true;
            }
          });
    });

    if (updated) {
      this._updates.notify(AIterable.from(this._all));
    }
  }

  protected abstract nodeOf(node: Node): N | undefined;

}

class DynamicComponentNodeList extends DynamicNodeList<ComponentNode_<any>> {

  constructor(context: ContextValues, node: ElementNode_, selector: string, opts: ElementNode_.SelectorOpts) {
    super(context, node, selector, opts);
  }

  protected nodeOf(node: Node): ComponentNode_<any> | undefined {
    return componentNodeOf(node);
  }

}

class DynamicElementNodeList extends DynamicNodeList<ElementNode_> {

  constructor(
      private readonly _context: ContextValues,
      element: any,
      selector: string,
      opts: ElementNode_.SelectorOpts) {
    super(_context, element, selector, opts);
  }

  protected nodeOf(node: Node): ElementNode_ {
    return elementNodeOf(this._context, node);
  }

}

function selectNodes(
    context: ContextValues,
    element: any,
    selector: string,
    opts: ElementNode_.SelectorOpts = {}): ElementNodeList<any> {
  if (opts.all) {
    return new DynamicElementNodeList(context, element, selector, opts);
  }
  return new DynamicComponentNodeList(context, element, selector, opts);
}

const NODE_REF = Symbol('element-node');

class ElementNode extends ElementNode_ {

  private readonly _attrs: NodeAttributes;

  constructor(private readonly _context: ContextValues, readonly element: Node) {
    super();
    this._attrs = new NodeAttributes(_context, element);
  }

  get type(): 'element' {
    return 'element';
  }

  get parentNode() {
    return parentNode(this._context, this.element);
  }

  attribute(name: string): ValueTracker<string | null, string> {
    return this._attrs.get(name);
  }

  select(selector: string, opts?: ElementNode_.SelectorOpts): ElementNodeList<any> {
    return selectNodes(this._context, this.element, selector, opts);
  }

}

function elementNodeOf(context: ContextValues, node: Node): ElementNode_ {

  const componentNode = componentNodeOf(node);

  if (componentNode) {
    return componentNode;
  }

  const found: ElementNode_ = (node as any)[NODE_REF];

  if (found) {
    return found;
  }

  const constructed = new ElementNode(context, node);

  (node as any)[NODE_REF] = constructed;

  return constructed;
}

function parentNode(context: ContextValues, node: Node): ElementNode_ | null {

  const parent = node.parentElement;

  return parent != null ? elementNodeOf(context, parent) : null;
}

export class ComponentNodeImpl<T extends object = object> {

  static readonly key = new SingleContextKey<ComponentNodeImpl<any>>('component-node:impl');

  private _parent?: ComponentNodeImpl;
  private readonly _parentUpdates = new EventEmitter<(this: void, parent: ComponentNode_ | null) => void>();
  private _node?: ComponentNode_<T>;
  private readonly _attrs: NodeAttributes;
  private readonly _props: NodeProperties;

  constructor(readonly context: ComponentContext<T>) {
    context.onConnect(() => this.parent = this._findParent());
    context.onDisconnect(() => this.parent = undefined);
    this._attrs = new NodeAttributes(context, context.element);
    this._props = new NodeProperties(context, context.element);
  }

  get parent(): ComponentNodeImpl | undefined {
    return this._parent;
  }

  set parent(value: ComponentNodeImpl | undefined) {
    if (this._parent === value) {
      return;
    }
    this._parent = value;
    this._parentUpdates.notify(value ? value.node : null);
  }

  private _findParent(): ComponentNodeImpl | undefined {

    let parent: ParentNode | null = (this.context.contentRoot as any).parentElement;

    while (parent) {

      const parentCtx: ComponentContext = (parent as any)[ComponentContext.symbol];

      if (parentCtx) {
        return parentCtx.get(ComponentNodeImpl);
      }

      parent = (parent as any).parentElement;
    }

    return;
  }

  get node(): ComponentNode_<T> {
    if (this._node) {
      return this._node;
    }

    const impl = this;

    class ComponentNode extends ComponentNode_<T> {

      get element() {
        return impl.context.element;
      }

      get parentNode() {
        return parentNode(impl.context, this.element);
      }

      get context() {
        return impl.context;
      }

      get parent() {

        const parent = impl.parent;

        return parent ? parent.node : null;
      }

      get onParentUpdate() {
        return impl._parentUpdates.on;
      }

      select(selector: string, opts?: ElementNode_.SelectorOpts): ElementNodeList<any> {
        return selectNodes(this.context, this.element, selector, opts);
      }

      attribute(name: string): ValueTracker<string | null, string> {
        return impl._attrs.get(name);
      }

      property<V>(key: PropertyKey): ValueTracker<V> {
        return impl._props.get(key);
      }

    }

    return this._node = new ComponentNode();
  }

}

function componentNodeOf(node: Node): ComponentNode_<any> | undefined {

  const ctx: ComponentContext | undefined = (node as any)[ComponentContext.symbol];

  return ctx && ctx.get(ComponentNode_);
}

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
