import { ComponentContext, SingleValueKey } from '@wesib/wesib';
import { EventEmitter, EventProducer } from 'fun-events';
import { ComponentNode as ComponentNode_, ComponentNodeList } from './component-node';

class DynamicNodeList<T extends object> extends ComponentNodeList<T> {

  readonly onUpdate = EventProducer.of<(this: void, list: ComponentNode_<T>[]) => void>(listener => {

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
  private _list: Set<ComponentNode_<T>> = new Set();
  private readonly _updates = new EventEmitter<(this: void, list: ComponentNode_<T>[]) => void>();

  constructor(
      private readonly _node: ComponentNodeImpl<any>,
      private readonly _selector: string,
      private readonly _init: MutationObserverInit) {
    super();
    this._observer = new MutationObserver(mutations => this._update(mutations));
  }

  get all(): ComponentNode_<T>[] {
    if (this._updates.consumers) {
      return [...this._list];
    }
    return this._refresh();
  }

  private _refresh() {

    const list = this._request();

    this._list = new Set<ComponentNode_<T>>(list);

    return list;
  }

  private _request(): ComponentNode_<T>[] {

    const element: HTMLElement = this._node.context.element;
    let list: ComponentNode_<T>[] = [];

    if (this._init.subtree) {
      list = Array.prototype.forEach.call(element.querySelectorAll(this._selector), (item: Element) => {

        const node = nodeOf<T>(item);

        if (node) {
          list.push(node);
        }
      });
    } else {
      Array.prototype.forEach.call(element.children, (item: Element) => {
        if (!item.matches(this._selector)) {
          return;
        }

        const node = nodeOf<T>(item);

        if (node) {
          list.push(node);
        }
      });
    }

    return list;
  }

  private _update(mutations: MutationRecord[]) {

    let updated = false;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(added => {

        const node = nodeOf<T>(added);

        if (node && !this._list.has(node)) {
          this._list.add(node);
          updated = true;
        }
      });
      mutation.removedNodes.forEach(removed => {

        const node = nodeOf<T>(removed);

        if (node && this._list.has(node)) {
          this._list.delete(node);
          updated = true;
        }
      });
    });

    if (updated) {
      this._updates.notify([...this._list]);
    }
  }

}

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

export class ComponentNodeImpl<T extends object = object> {

  static readonly key = new SingleValueKey<ComponentNodeImpl<any>>('component-node:impl');

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

    let parent: ParentNode | null = this.context.contentRoot;

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

      select<N extends object = object>(selector: string, opts?: { deep?: boolean }): ComponentNodeList<N> {
        return impl.select(selector, opts);
      }

    }

    return new ComponentNode();
  }

}

function nodeOf<T extends object>(node: Node): ComponentNode_<T> | undefined {

  const ctx: ComponentContext | undefined = (node as any)[ComponentContext.symbol];

  return ctx && ctx.get(ComponentNode_);
}
