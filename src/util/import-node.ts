/**
 * @module @wesib/generic
 */
import { itsEach, overArray } from 'a-iterable';

/**
 * Imports DOM node from one document to another.
 *
 * @param from  The node to import.
 * @param to  The node to append imported node to.
 * @param importContent  A function that imports nodes nested in parent element. [[importNodeContents]] by default.
 *
 * @returns Imported node.
 */
export function importNode<N extends Node>(
    from: N,
    to: Node,
    importContent: (this: void, from: N, to: N) => void = importNodeContent,
): N {

  const doc = to.ownerDocument!;

  if (from.nodeType !== Node.ELEMENT_NODE) {

    const nodeClone = doc.importNode(from, false);

    to.appendChild(nodeClone);

    return nodeClone;
  }

  const element = from as Node as Element;
  const elementClone = doc.createElement(element.tagName.toLowerCase()) as Node as (Element & N);

  element.getAttributeNames().forEach(attr => elementClone.setAttribute(attr, element.getAttribute(attr)!));

  importContent(from, elementClone);
  to.appendChild(elementClone);

  return elementClone;
}

/**
 * Imports DOM node contents from one document to another.
 *
 * @param from  The node which contents to import.
 * @param to  The node to append imported nodes to.
 */
export function importNodeContent(from: Node, to: Node): void {
  itsEach(
      overArray(from.childNodes),
      node => importNode(node, to),
  );
}
