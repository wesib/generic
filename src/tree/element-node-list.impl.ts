import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { AIterable, filterIt, itsIterator, itsReduction, overArray } from 'a-iterable';
import { EventEmitter, EventProducer } from 'fun-events';
import { ElementNode, ElementNodeList as ElementNodeList_ } from './element-node';

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

export class ElementNodeList<N extends ElementNode> extends ElementNodeList_<N> {

  readonly onUpdate = EventProducer.of<[AIterable<N>]>(listener => {

    const firstConsumer = !this._updates.consumers;
    const interest = this._updates.on(listener);

    if (firstConsumer) {
      this._refresh();
      this._observer.observe(this._root, this._init);
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
  private readonly _updates = new EventEmitter<[AIterable<N>]>();
  private readonly _init: MutationObserverInit;
  private _all: Set<Element> = new Set();

  constructor(
      bs: BootstrapContext,
      private readonly _root: Element,
      private readonly _selector: string,
      private readonly _nodeOf: (node: Element, optional?: boolean) => N | undefined,
      { deep, all }: ElementNode.SelectorOpts) {
    super();
    this._init = deep ? WATCH_DEEP : WATCH_CHILD_LIST;

    const Observer: typeof MutationObserver = (bs.get(BootstrapWindow) as any).MutationObserver;

    this._observer = new Observer(mutations => this._update(mutations));

    if (!all) {
      this._listenForMounts();
    }
  }

  [Symbol.iterator]() {
    return itsIterator(AIterable.from(this.all)
        .map<N | undefined>(element => this._nodeOf(element))
        .filter<N>(isPresent));
  }

  get all(): Set<Element> {
    return this._updates.consumers ? this._all : this._refresh();
  }

  private _refresh(): Set<Element> {
    return this._all = new Set<Element>(this._request());
  }

  private _request(): Set<Element> {
    if (this._init.subtree) {
      return new Set(overArray(this._root.querySelectorAll(this._selector)));
    }
    return new Set(
        filterIt(
            overArray(this._root.children),
            item => item.matches(this._selector)));
  }

  private _listenForMounts() {
    this._root.addEventListener('wesib:component', event => {

      const element = event.target as Element;

      if (this._all.has(element)) {
        this._updates.notify(this);
      }
    });
  }

  private _update(mutations: MutationRecord[]) {

    const updated = mutations.reduce(
        (prev, mutation) => {

          const hasRemoved = itsReduction(
              overArray(mutation.removedNodes),
              (up, removed) => this._removed(removed as Element) || up,
              prev);

          return itsReduction(
              overArray(mutation.addedNodes),
              (up, added) => this._added(added) || up,
              hasRemoved);
        },
        false);

    if (updated) {
      this._updates.notify(this);
    }
  }

  private _added(node: Node): boolean {
    if (!isElement(node)) {
      return false;
    }
    if (node.matches(this._selector) && !this._all.has(node)) {
      this._all.add(node);

      const elementNode = this._nodeOf(node);

      if (elementNode) {
        return true;
      }
    }

    return false;
  }

  private _removed(node: Node): boolean {
    if (!isElement(node)) {
      return false;
    }
    if (!this._all.delete(node)) {
      return false;
    }

    return !!this._nodeOf(node, true);
  }

}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
