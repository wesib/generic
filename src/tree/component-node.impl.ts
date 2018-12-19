import { BootstrapWindow, ComponentContext } from '@wesib/wesib';
import { AIterable, itsIterator, overArray } from 'a-iterable';
import { SingleContextKey } from 'context-values';
import { EventEmitter, EventProducer } from 'fun-events';
import { AttributeTracker } from './attribute-tracker';
import { AttributesObserver } from './attributes-observer';
import { ComponentNode as ComponentNode_, ComponentNodeList } from './component-node';
import { PropertyTracker } from './property-tracker';
import { ValueTracker } from './value-tracker';

class DynamicNodeList<T extends object> extends ComponentNodeList<T> {

  readonly onUpdate = EventProducer.of<(this: void, list: AIterable<ComponentNode_<T>>) => void>(listener => {

      const firstConsumer = !this._updates.consumers;
      const interest = this._updates.on(listener);

      if (firstConsumer) {
        this._refresh();
        this._observer.observe(this._node.context.element, this._init);
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
  private _all: Set<ComponentNode_<T>> = new Set();
  private readonly _updates = new EventEmitter<(this: void, list: AIterable<ComponentNode_<T>>) => void>();

  constructor(
      private readonly _node: ComponentNodeImpl<any>,
      private readonly _selector: string,
      private readonly _init: MutationObserverInit) {
    super();

    const Observer: typeof MutationObserver = (_node.context.get(BootstrapWindow) as any).MutationObserver;

    this._observer = new Observer(mutations => this._update(mutations));
  }

  [Symbol.iterator]() {
    return itsIterator(this.all);
  }

  get all(): Set<ComponentNode_<T>> {
    if (this._updates.consumers) {
      return this._all;
    }
    return this._refresh();
  }

  private _refresh(): Set<ComponentNode_<T>> {
    return this._all = new Set<ComponentNode_<T>>(this._request());
  }

  private _request(): AIterable<ComponentNode_<T>> {

    const element: HTMLElement = this._node.context.element;
    let iter: AIterable<Element>;

    if (this._init.subtree) {
      iter = AIterable.from(overArray(element.querySelectorAll(this._selector)));
    } else {
      iter = AIterable.from(overArray(element.children))
          .filter(item => item.matches(this._selector));
    }

    return iter.map<ComponentNode_<T> | undefined>(nodeOf)
            .filter<ComponentNode_<T>>(isPresent);
  }

  private _update(mutations: MutationRecord[]) {

    let updated = false;

    mutations.forEach(mutation => {
      AIterable.from(overArray(mutation.addedNodes))
          .forEach(added => {

            const node = nodeOf<T>(added);

            if (node && !this._all.has(node)) {
              this._all.add(node);
              updated = true;
            }
          });
      AIterable.from(overArray(mutation.removedNodes))
          .forEach(removed => {

            const node = nodeOf<T>(removed);

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

}

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

export class ComponentNodeImpl<T extends object = object> {

  static readonly key = new SingleContextKey<ComponentNodeImpl<any>>('component-node:impl');

  private _parent?: ComponentNodeImpl;
  private readonly _parentUpdates = new EventEmitter<(this: void, parent: ComponentNode_ | null) => void>();
  private _node?: ComponentNode_<T>;

  constructor(readonly context: ComponentContext<T>) {
    context.onConnect(() => this.parent = this._findParent());
    context.onDisconnect(() => this.parent = undefined);
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

  select<N extends object = object>(
      selector: string,
      { deep = false }: { deep?: boolean } = {}): ComponentNodeList<N> {
    return new DynamicNodeList<N>(this, selector, deep ? WATCH_DEEP : WATCH_CHILD_LIST);
  }

  private _findParent(): ComponentNodeImpl | undefined {

    let parent: ParentNode | null = (this.context.contentRoot as any).parentNode;

    while (parent) {

      const parentCtx: ComponentContext = (parent as any)[ComponentContext.symbol];

      if (parentCtx) {
        return parentCtx.get(ComponentNodeImpl);
      }

      parent = (parent as any).parentNode;
    }

    return;
  }

  get node(): ComponentNode_<T> {
    if (this._node) {
      return this._node;
    }

    const impl = this;

    class ComponentNode extends ComponentNode_<T> {

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

      select<N extends object = object>(selector: string, opts?: ComponentNode_.SelectorOpts): ComponentNodeList<N> {
        return impl.select(selector, opts);
      }

      property<V>(key: PropertyKey): ValueTracker<V> {
        return new PropertyTracker(this.context, key);
      }

      attribute(name: string): ValueTracker<string, string | null> {
        return new AttributeTracker(impl.context, name);
      }

    }

    return this._node = new ComponentNode();
  }

}

function nodeOf<T extends object>(node: Node): ComponentNode_<T> | undefined {

  const ctx: ComponentContext | undefined = (node as any)[ComponentContext.symbol];

  return ctx && ctx.get(ComponentNode_);
}

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
