import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { AIterable, itsIterator, overArray } from 'a-iterable';
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
  private readonly _updates = new EventEmitter<[AIterable<N>]>();
  private readonly _init: MutationObserverInit;

  constructor(
      bs: BootstrapContext,
      private readonly _element: Element,
      private readonly _selector: string,
      private readonly _nodeOf: (node: Element, optional?: boolean) => N | undefined,
      { deep }: ElementNode.SelectorOpts) {
    super();
    this._init = deep ? WATCH_DEEP : WATCH_CHILD_LIST;

    const Observer: typeof MutationObserver = (bs.get(BootstrapWindow) as any).MutationObserver;

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

    let iter: AIterable<Element>;

    if (this._init.subtree) {
      iter = AIterable.from(overArray(this._element.querySelectorAll(this._selector)));
    } else {
      iter = AIterable.from(overArray(this._element.children))
          .filter(item => item.matches(this._selector));
    }

    return iter.map<N | undefined>(node => this._nodeOf(node))
        .filter<N>(isPresent);
  }

  private _update(mutations: MutationRecord[]) {

    let updated = false;

    mutations.forEach(mutation => {
      AIterable.from(overArray(mutation.addedNodes))
          .forEach(added => {

            const addedElement = added as Element;

            if (addedElement.matches(this._selector)) {

              const node = this._nodeOf(addedElement);

              if (node && !this._all.has(node)) {
                this._all.add(node);
                updated = true;
              }
            }
          });
      AIterable.from(overArray(mutation.removedNodes))
          .forEach(removed => {

            const removedElement = removed as Element;
            const node = this._nodeOf(removedElement, true);

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

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
