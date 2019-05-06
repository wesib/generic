import { ComponentContext, ElementDef } from '@wesib/wesib';
import { ContextRequest, ContextTarget, ContextValues, SingleContextKey } from 'context-values';
import { NameInNamespace, NamespaceDef } from 'style-producer';
import { DefaultNamespaceAliaser } from './default-namespace-aliaser';

/**
 * @internal
 */
export type ElementIdClass = NameInNamespace;

/**
 * @internal
 */
export const ElementIdClass__ns = /*#__PURE*/ new NamespaceDef(
    'https://wesib.github.io/ns/element-id-class',
    'elic',
    'element-id-class');

/**
 * @internal
 */
export const ElementIdClass: ContextTarget<ElementIdClass> & ContextRequest<ElementIdClass> =
    /*#__PURE__*/ new SingleContextKey('unique-element-class', assignElementId);

let uniqueClassSeq = 0;

function assignElementId(contextValues: ContextValues): ElementIdClass {

  const aliaser = contextValues.get(DefaultNamespaceAliaser);
  const context = contextValues.get(ComponentContext);
  const elementDef = context.get(ElementDef);
  const name = elementDef.name || 'component';
  const local = `${name}#${++uniqueClassSeq}`;
  const qualified = ElementIdClass__ns.qualify(aliaser(ElementIdClass__ns), local, 'css');
  const element = context.element as Element;

  element.classList.add(qualified);

  return qualified;
}
