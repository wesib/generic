import { BootstrapContext, BootstrapWindow, ComponentClass, DefaultNamespaceAliaser, isElement } from '@wesib/wesib';
import { AIterable, ArrayLikeIterable, filterIt, itsEach, itsFirst, itsIterator, mapIt, overArray } from 'a-iterable';
import { isPresent, nextArgs } from 'call-thru';
import { AfterEvent, afterEventBy, afterSupplied, EventEmitter, eventSupply, OnEvent, onEventBy } from 'fun-events';
import { html__naming } from 'namespace-aliaser';
import { ElementNode, ElementNodeList as ElementNodeList_ } from './element-node';

const WATCH_CHILD_LIST = { childList: true };
const WATCH_DEEP = { childList: true, subtree: true };

/**
 * @internal
 */
export function elementNodeList<N extends ElementNode>(
    bsContext: BootstrapContext,
    root: Element,
    selectorOrType: string | ComponentClass<any>,
    nodeOf: (node: Element, optional?: boolean) => N | undefined,
    { deep, all }: ElementNode.SelectorOpts,
): ElementNodeList_<N> {

  const updates = new EventEmitter<[N[], N[]]>();
  const init: MutationObserverInit = deep ? WATCH_DEEP : WATCH_CHILD_LIST;
  let cache = new Set<Element>();
  let iterable: Iterable<N> | undefined;
  let selector: string | undefined;

  if (typeof selectorOrType === 'string') {
    selector = selectorOrType;
  } else {
    bsContext.whenDefined(selectorOrType).then(({ elementDef: { name } }) => {
      if (name) {
        selector = html__naming.name(name, bsContext.get(DefaultNamespaceAliaser));
        if (updates.size) {

          const selected = refresh();

          if (selected.size) {

            const added = [
              ...filterIt<N | undefined, N>(
                  mapIt(selected, node => nodeOf(node)),
                  isPresent,
              ),
            ];

            if (added.length) {
              updates.send(added, []);
            }
          }
        }
      }
    });
  }

  const Observer = bsContext.get(BootstrapWindow).MutationObserver;
  const observer = new Observer(update);
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
  const onTrackUpdate: OnEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]> =
      onUpdate.thru((added, removed) => nextArgs(AIterable.of(added), AIterable.of(removed)));
  const track = afterEventBy<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>(receiver => {

    const initialEmitter = new EventEmitter<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>();

    initialEmitter.on(receiver);
    initialEmitter.send(nodeList, AIterable.of([]));

    onTrackUpdate(receiver);
  });
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

    get track() {
      return track;
    }

    get first() {
      return first;
    }

    [Symbol.iterator]() {
      return itsIterator(iterable || (iterable = filterIt<N | undefined, N>(
          mapIt(
              elements(),
              element => nodeOf(element),
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
    return cache = select();
  }

  function select(): Set<Element> {

    const sel = selector;

    if (!sel) {
      return new Set();
    }
    if (deep) {
      return new Set(overArray(root.querySelectorAll(sel)));
    }
    return new Set(
        filterIt(
            overArray(root.children),
            item => item.matches(sel),
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
    if (selector && node.matches(selector) && !cache.has(node)) {
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
