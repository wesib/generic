import { isElementNode } from '@frontmeans/drek';
import { itsEach, overArray } from '@proc7ts/push-iterator';

/**
 * Imports DOM node from one document to another.
 *
 * @typeParam TNode - DOM node type.
 * @param from - The node to import.
 * @param to - The node to append imported node to.
 * @param importContent - A function that imports nodes nested in parent element. {@link importNodeContent} by default.
 *
 * @returns Imported node.
 */
export function importNode<TNode extends Node>(
    from: TNode,
    to: Node,
    importContent?: (this: void, from: TNode, to: TNode) => void,
): TNode;

/**
 * Imports DOM node from one document to another and inserts it before the given node.
 *
 * @typeParam TNode - DOM node type.
 * @param from - The node to import.
 * @param to - The node to append imported node to.
 * @param before - The node to insert imported node before, or `null` to append it to the end of target one.
 * @param importContent - A function that imports nodes nested in parent element. {@link importNodeContent} by default.
 *
 * @returns Imported node.
 */
export function importNode<TNode extends Node>(
    from: TNode,
    to: Node,
    before?: Node | null,
    importContent?: (this: void, from: TNode, to: TNode) => void,
): TNode;

export function importNode<TNode extends Node>(
    from: TNode,
    to: Node,
    beforeOrImport?: Node | null | ((this: void, from: TNode, to: TNode) => void),
    importContent: (this: void, from: TNode, to: TNode) => void = importNodeContent,
): TNode {

  let before: Node | null;

  if (typeof beforeOrImport === 'function') {
    importContent = beforeOrImport;
    before = null;
  } else {
    before = beforeOrImport || null;
  }

  const doc = to.ownerDocument!;

  if (isElementNode(from)) {

    const elementClone = doc.createElement(from.tagName.toLowerCase()) as Node as (Element & TNode);

    from.getAttributeNames().forEach(attr => elementClone.setAttribute(attr, from.getAttribute(attr)!));
    importContent(from, elementClone);
    to.insertBefore(elementClone, before);

    return elementClone;
  }

  const nodeClone = doc.importNode(from, false);

  to.insertBefore(nodeClone, before);

  return nodeClone;
}

/**
 * Imports DOM node contents from one document to another.
 *
 * @param from - The node which contents to import.
 * @param to - The node to append imported nodes to.
 */
export function importNodeContent(from: Node, to: Node): void {
  itsEach(
      overArray(from.childNodes),
      node => importNode(node, to),
  );
}
