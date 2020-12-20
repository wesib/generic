import { html__naming } from '@frontmeans/namespace-aliaser';
import {
  AfterEvent,
  afterEventBy,
  afterSupplied,
  EventEmitter,
  mapAfter,
  OnEvent,
  onEventBy,
  translateAfter,
} from '@proc7ts/fun-events';
import { isPresent, valueProvider } from '@proc7ts/primitives';
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
export function elementNodeList<TNode extends ElementNode>(
    bsContext: BootstrapContext,
    root: Element,
    selectorOrType: string | ComponentClass<any>,
    nodeOf: (node: Element, optional?: boolean) => TNode | undefined,
    { deep, all }: ElementPickMode,
): ElementNodeList<TNode> {

  const updates = new EventEmitter<[TNode[], TNode[]]>();
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
                filterIt<TNode | undefined, TNode>(
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

        const node = nodeOf(element) as TNode;

        updates.send([node], []);
      }
    });
  }

  const iterable: PushIterable<TNode> = filterIt<TNode | undefined, TNode>(
      mapIt(
          overIterator(elements),
          element => nodeOf(element),
      ),
      isPresent,
  );

  class ElementNodeList$ extends ElementNodeList<TNode> implements PushIterable<TNode> {

    readonly onUpdate: OnEvent<[TNode[], TNode[]]>;
    readonly read: AfterEvent<[ElementNodeList<TNode>]>;
    readonly track: AfterEvent<[readonly TNode[], readonly TNode[]]>;
    readonly first: AfterEvent<[TNode?]>;

    constructor() {
      super();

      const observer = bsContext.get(ElementObserver)(update);

      this.onUpdate = onEventBy<[TNode[], TNode[]]>(receiver => {

        const firstReceiver = !updates.size;
        const supply = updates.on(receiver);

        if (firstReceiver) {
          refresh();
          observer.observe(root, init);
        }

        supply.whenOff(() => {
          if (!updates.size) {
            observer.disconnect();
            clearCache(); // clear cache as there is no more receivers
          }
        }).needs(receiver.supply);
      });

      const returnSelf = valueProvider(this);

      this.read = this.onUpdate.do(mapAfter(returnSelf, returnSelf));

      this.track = afterEventBy<[readonly TNode[], readonly TNode[]]>(receiver => {

        const initialEmitter = new EventEmitter<[readonly TNode[], readonly TNode[]]>();

        initialEmitter.on(receiver);
        initialEmitter.send(itsElements(this), []);

        this.onUpdate(receiver);
      });

      this.first = afterSupplied(this.read).do(translateAfter(
          (send, list) => send(itsFirst(list)),
      ));
    }

    [Symbol.iterator](): PushIterator<TNode> {
      return this[PushIterator__symbol]();
    }

    [PushIterator__symbol](accept?: PushIterator.Acceptor<TNode>): PushIterator<TNode> {
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

    const added: TNode[] = [];
    const removed: TNode[] = [];

    mutations.forEach(mutation => {
      itsEach(
          filterIt<TNode | undefined, TNode>(
              mapIt(overNodes(mutation.removedNodes), removeNode),
              isPresent,
          ),
          node => removed.push(node),
      );
      itsEach(
          filterIt<TNode | undefined, TNode>(
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

  function addNode(node: Node): TNode | undefined {
    if (!isElement(node)) {
      return;
    }
    if (selector && node.matches(selector) && !cache.has(node)) {
      cache.add(node);
      return nodeOf(node);
    }
    return;
  }

  function removeNode(node: Node): TNode | undefined {
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
