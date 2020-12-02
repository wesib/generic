import { html__naming } from '@frontmeans/namespace-aliaser';
import { nextArg } from '@proc7ts/call-thru';
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
} from '@proc7ts/fun-events';
import { isPresent, valuesProvider } from '@proc7ts/primitives';
import {
  filterArray,
  filterIt,
  flatMapArray,
  iteratorOf,
  itsEach,
  itsElements,
  itsFirst,
  mapIt,
  overArray,
  overIterator,
  PushIterable,
  PushIterator,
  PushIterator__symbol,
} from '@proc7ts/push-iterator';
import {
  BootstrapContext,
  ComponentClass,
  DefaultNamespaceAliaser,
  ElementObserver,
  ElementObserverInit,
  isElement,
} from '@wesib/wesib';
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
  let selector: string | undefined;
  const overNodes: (nodes: NodeList) => Iterable<Node> = deep ? overNodeSubtree : overArray;

  if (typeof selectorOrType === 'string') {
    selector = selectorOrType;
  } else {
    bsContext.whenDefined(selectorOrType).then(({ elementDef: { name } }) => {
      if (name) {
        selector = html__naming.name(name, bsContext.get(DefaultNamespaceAliaser));
        if (updates.size) {
          // Refresh selection after component name resolution.
          // This is needed  when new document loaded.

          const selected = refresh();

          if (selected.size) {

            const added = itsElements(
                filterIt<N | undefined, N>(
                    mapIt(selected, node => nodeOf(node)),
                    isPresent,
                ),
            );

            /* istanbul ignore if. Can not test native custom element */
            if (added.length) {
              updates.send(added, []);
            }
          }
        }
      }
    }).catch(console.error);
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

  const iterable: PushIterable<N> = filterIt<N | undefined, N>(
      mapIt(
          overIterator(elements),
          element => nodeOf(element),
      ),
      isPresent,
  );

  class ElementNodeList$ extends ElementNodeList<N> implements PushIterable<N> {

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
            clearCache(); // clear cache as there is no more receivers
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

    track(): AfterEvent<[readonly N[], readonly N[]]>;
    track(receiver: EventReceiver<[readonly N[], readonly N[]]>): EventSupply;
    track(
        receiver?: EventReceiver<[readonly N[], readonly N[]]>,
    ): AfterEvent<[readonly N[], readonly N[]]> | EventSupply {

      const onUpdate: OnEvent<[readonly N[], readonly N[]]> = this.onUpdate();

      return (this.track = afterEventBy<[readonly N[], readonly N[]]>(receiver => {

        const initialEmitter = new EventEmitter<[readonly N[], readonly N[]]>();

        initialEmitter.on(receiver);
        initialEmitter.send(itsElements(this), []);

        onUpdate.to(receiver);
      }).F)(receiver);
    }

    first(): AfterEvent<[N?]>;
    first(receiver: EventReceiver<[N?]>): EventSupply;
    first(receiver?: EventReceiver<[N?]>): AfterEvent<[N?]> | EventSupply {
      return (this.first = afterSupplied(this.read()).keepThru(
          list => nextArg<N | undefined>(itsFirst(list)),
      ).F)(receiver);
    }

    [Symbol.iterator](): PushIterator<N> {
      return this[PushIterator__symbol]();
    }

    [PushIterator__symbol](accept?: PushIterator.Acceptor<N>): PushIterator<N> {
      return iterable[PushIterator__symbol](accept);
    }

  }

  return new ElementNodeList$();

  function elements(): Iterator<Element> {
    return iteratorOf(updates.size ? cache : refresh());
  }

  function clearCache(): void {
    cache.clear();
  }

  function refresh(): Set<Element> {

    const list = select();

    if (updates.size) {
      cache = list; // cache is for receivers only
    }

    return list;
  }

  function select(): Set<Element> {

    const sel = selector;

    if (!sel) {
      return new Set();
    }
    if (deep) {
      return new Set(overArray(root.querySelectorAll(sel)));
    }

    return new Set(filterArray(root.children, item => item.matches(sel)));
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
  return flatMapArray(
      nodes,
      node => overArray([node, ...overNodeSubtree(node.childNodes)]),
  );
}
