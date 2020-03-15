import {
  BootstrapContext,
  ComponentClass,
  DefaultNamespaceAliaser,
  ElementObserver,
  ElementObserverInit,
  isElement,
} from '@wesib/wesib';
import {
  AIterable,
  ArrayLikeIterable,
  filterIt,
  flatMapIt,
  itsEach,
  itsFirst,
  itsIterator,
  mapIt,
  overArray,
} from 'a-iterable';
import { isPresent, nextArg, nextArgs, valuesProvider } from 'call-thru';
import {
  AfterEvent,
  afterEventBy,
  afterSent,
  afterSupplied,
  EventEmitter,
  EventReceiver,
  EventSupply,
  OnEvent,
  onEventBy,
} from 'fun-events';
import { html__naming } from 'namespace-aliaser';
import { ElementNode, ElementPickMode } from './element-node';
import { ElementNodeList } from './element-node-list';

/**
 * @internal
 */
const WATCH_DEEP: ElementObserverInit = { subtree: true };

/**
 * @internal
 */
export function elementNodeList<N extends ElementNode>(
    bsContext: BootstrapContext,
    root: Element,
    selectorOrType: string | ComponentClass<any>,
    nodeOf: (node: Element, optional?: boolean) => N | undefined,
    { deep, all }: ElementPickMode,
): ElementNodeList<N> {

  const updates = new EventEmitter<[N[], N[]]>();
  const init = deep ? WATCH_DEEP : undefined;
  let cache = new Set<Element>();
  let iterable: Iterable<N> | undefined;
  let selector: string | undefined;
  const overNodes: (nodes: NodeList) => Iterable<Node> = deep ? overNodeSubtree : overArray;

  if (typeof selectorOrType === 'string') {
    selector = selectorOrType;
  } else {
    bsContext.whenDefined(selectorOrType).then(({ elementDef: { name } }) => {
      iterable = undefined;
      if (name) {
        selector = html__naming.name(name, bsContext.get(DefaultNamespaceAliaser));
        if (updates.size) {

          const selected = refresh();

          if (selected.size) {

            const added = Array.from(
                filterIt<N | undefined, N>(
                    mapIt(selected, node => nodeOf(node)),
                    isPresent,
                ),
            );

            if (added.length) {
              updates.send(added, []);
            }
          }
        }
      }
    });
  }

  if (!all) {
    root.addEventListener('wesib:component', event => {

      const element = event.target as Element;

      if (cache.has(element)) {

        const node = nodeOf(element) as N;

        updates.send([node], []);
      }
    });
  }

  class ElementNodeList$ extends ElementNodeList<N> {

    onUpdate(): OnEvent<[N[], N[]]>;
    onUpdate(receiver: EventReceiver<[N[], N[]]>): EventSupply;
    onUpdate(receiver?: EventReceiver<[N[], N[]]>): OnEvent<[N[], N[]]> | EventSupply {

      const observer = bsContext.get(ElementObserver)(update);

      return (this.onUpdate = onEventBy<[N[], N[]]>(receiver => {

        const firstReceiver = !updates.size;
        const supply = updates.on(receiver);

        if (firstReceiver) {
          refresh();
          observer.observe(root, init);
        }

        return supply.whenOff(() => {
          if (!updates.size) {
            observer.disconnect();
          }
        });
      }).F)(receiver);
    }

    read(): AfterEvent<[ElementNodeList<N>]>;
    read(receiver: EventReceiver<[ElementNodeList<N>]>): EventSupply;
    read(receiver?: EventReceiver<[ElementNodeList<N>]>): AfterEvent<[ElementNodeList<N>]> | EventSupply {
      return (this.read = afterSent<[ElementNodeList<N>]>(
          this.onUpdate().thru(() => this),
          valuesProvider(this),
      ).F)(receiver);
    }

    track(): AfterEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>;
    track(receiver: EventReceiver<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>): EventSupply;
    track(
        receiver?: EventReceiver<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>,
    ): AfterEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]> | EventSupply {

      const onTrackUpdate: OnEvent<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]> = this.onUpdate().thru(
          (added, removed) => nextArgs(AIterable.of(added), AIterable.of(removed)),
      );

      return (this.track = afterEventBy<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>(receiver => {

        const initialEmitter = new EventEmitter<[ArrayLikeIterable<N>, ArrayLikeIterable<N>]>();

        initialEmitter.on(receiver);
        initialEmitter.send(this, AIterable.of([]));

        onTrackUpdate.to(receiver);
      }).F)(receiver);
    }

    first(): AfterEvent<[N?]>;
    first(receiver: EventReceiver<[N?]>): EventSupply;
    first(receiver?: EventReceiver<[N?]>): AfterEvent<[N?]> | EventSupply {
      return (this.first = afterSupplied(this.read()).keepThru(
          list => nextArg<N | undefined>(itsFirst(list)),
      ).F)(receiver);
    }

    [Symbol.iterator](): Iterator<N> {
      return itsIterator(iterable || (iterable = filterIt<N | undefined, N>(
          mapIt(
              elements(),
              element => nodeOf(element),
          ),
          isPresent,
      )));
    }

  }

  return new ElementNodeList$();

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

  function update(mutations: MutationRecord[]): void {

    const added: N[] = [];
    const removed: N[] = [];

    mutations.forEach(mutation => {
      itsEach(
          filterIt<N | undefined, N>(
              mapIt(overNodes(mutation.removedNodes), removeNode),
              isPresent,
          ),
          node => removed.push(node),
      );
      itsEach(
          filterIt<N | undefined, N>(
              mapIt(overNodes(mutation.addedNodes), addNode),
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

function overNodeSubtree(nodes: NodeList): Iterable<Node> {
  return flatMapIt(
      overArray(nodes),
      node => [node, ...overNodeSubtree(node.childNodes)],
  );
}
