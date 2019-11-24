import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { AIterable, filterIt, itsFirst, itsIterator, itsReduction, mapIt, overArray } from 'a-iterable';
import { AfterEvent, afterEventBy, afterSupplied, EventEmitter, eventSupply, onEventBy } from 'fun-events';
import { ElementNode, ElementNodeList as ElementNodeList_ } from './element-node';

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

/**
 * @internal
 */
export function elementNodeList<N extends ElementNode>(
    bsContext: BootstrapContext,
    root: Element,
    selector: string,
    nodeOf: (node: Element, optional?: boolean) => N | undefined,
    { deep, all }: ElementNode.SelectorOpts,
): ElementNodeList_<N> {

  const Observer: typeof MutationObserver = (bsContext.get(BootstrapWindow) as any).MutationObserver;
  const observer = new Observer(update);
  const updates = new EventEmitter<[AIterable<N>]>();
  const init: MutationObserverInit = deep ? WATCH_DEEP : WATCH_CHILD_LIST;
  let cache = new Set<Element>();
  let iterable: Iterable<N> | undefined;
  let nodeList: ElementNodeList;

  const onUpdate = onEventBy<[ElementNodeList]>(listener => {

    const firstReceiver = !updates.size;
    const supply = updates.on(listener);

    if (firstReceiver) {
      refresh();
      observer.observe(root, init);
    }

    return eventSupply(reason => {
      supply.off(reason);
      if (!updates.size) {
        observer.disconnect();
      }
    }).needs(supply);
  });
  const read = afterEventBy<[ElementNodeList]>(onUpdate, () => [nodeList]);
  const first: AfterEvent<[N?]> = afterSupplied(read).keep.thru(itsFirst);

  if (!all) {
    root.addEventListener('wesib:component', event => {

      const element = event.target as Element;

      if (cache.has(element)) {
        updates.send(nodeList);
      }
    });
  }

  class ElementNodeList extends ElementNodeList_<N> {

    get onUpdate() {
      return onUpdate;
    }

    get read() {
      return read;
    }

    get first() {
      return first;
    }

    [Symbol.iterator]() {
      return itsIterator(iterable || (iterable = filterIt<N | undefined, N>(
          mapIt(
              elements(),
              element => nodeOf(element)
          ),
          isPresent,
      )));
    }

  }

  return nodeList = new ElementNodeList();

  function elements(): Set<Element> {
    return updates.size ? cache : refresh();
  }

  function refresh(): Set<Element> {
    iterable = undefined;
    return cache = new Set<Element>(request());
  }

  function request(): Set<Element> {
    if (deep) {
      return new Set(overArray(root.querySelectorAll(selector)));
    }
    return new Set(
        filterIt(
            overArray(root.children),
            item => item.matches(selector),
        ),
    );
  }

  function update(mutations: MutationRecord[]) {

    const updated = mutations.reduce(
        (prev, mutation) => {

          const hasRemoved = itsReduction(
              overArray(mutation.removedNodes),
              (up, removed) => removeNode(removed as Element) || up,
              prev,
          );

          return itsReduction(
              overArray(mutation.addedNodes),
              (up, added) => addNode(added) || up,
              hasRemoved,
          );
        },
        false,
    );

    if (updated) {
      updates.send(nodeList);
    }
  }

  function addNode(node: Node): boolean {
    if (!isElement(node)) {
      return false;
    }
    if (node.matches(selector) && !cache.has(node)) {
      cache.add(node);

      const elementNode = nodeOf(node);

      if (elementNode) {
        return true;
      }
    }
    return false;
  }

  function removeNode(node: Node): boolean {
    if (!isElement(node)) {
      return false;
    }
    if (!cache.delete(node)) {
      return false;
    }
    return !!nodeOf(node, true);
  }

}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
