import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { filterIt, itsEach, itsFirst, itsIterator, mapIt, overArray } from 'a-iterable';
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
  const updates = new EventEmitter<[N[], N[]]>();
  const init: MutationObserverInit = deep ? WATCH_DEEP : WATCH_CHILD_LIST;
  let cache = new Set<Element>();
  let iterable: Iterable<N> | undefined;
  let nodeList: ElementNodeList;

  const onUpdate = onEventBy<[N[], N[]]>(receiver => {

    const firstReceiver = !updates.size;
    const supply = updates.on(receiver);

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
  const read = afterEventBy<[ElementNodeList]>(onUpdate.thru(() => nodeList), () => [nodeList]);
  const first: AfterEvent<[N?]> = afterSupplied(read).keep.thru(itsFirst);

  if (!all) {
    root.addEventListener('wesib:component', event => {

      const element = event.target as Element;

      if (cache.has(element)) {

        const node = nodeOf(element) as N;

        updates.send([node], [node]);
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

    const added: N[] = [];
    const removed: N[] = [];

    mutations.forEach(mutation => {
      itsEach(
          filterIt<N | undefined, N>(
              mapIt(overArray(mutation.removedNodes), removeNode),
              isPresent,
          ),
          node => removed.push(node),
      );
      itsEach(
          filterIt<N | undefined, N>(
              mapIt(overArray(mutation.addedNodes), addNode),
              isPresent,
          ),
          node => added.push(node),
      );
    });
    if (added.length || removed.length) {
      updates.send(added, removed);
    }
  }

  function addNode(node: Node): N | undefined {
    if (!isElement(node)) {
      return;
    }
    if (node.matches(selector) && !cache.has(node)) {
      cache.add(node);
      return nodeOf(node);
    }
    return;
  }

  function removeNode(node: Node): N | undefined {
    if (!isElement(node)) {
      return;
    }
    if (!cache.delete(node)) {
      return;
    }
    return nodeOf(node, true);
  }

}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isPresent<T>(item: T | undefined): item is T {
  return item != null;
}
