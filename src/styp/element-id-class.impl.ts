import { ContextValues, SingleContextKey, SingleContextRef } from '@proc7ts/context-values';
import { css__naming, html__naming, NamespaceDef, QualifiedName } from '@proc7ts/namespace-aliaser';
import { ComponentContext, DefaultNamespaceAliaser, ElementDef } from '@wesib/wesib';

/**
 * @internal
 */
export type ElementIdClass = QualifiedName;

/**
 * @internal
 */
export const ElementIdClass__NS = (/*#__PURE__*/ new NamespaceDef(
    'https://wesib.github.io/ns/element-id-class',
    'elic',
    'element-id-class',
));

/**
 * @internal
 */
export const ElementIdClass: SingleContextRef<ElementIdClass> = (/*#__PURE__*/ new SingleContextKey(
    'unique-element-class',
    { byDefault: assignElementId },
));

/**
 * @internal
 */
let uniqueClassSeq = 0;

/**
 * @internal
 */
function assignElementId(contextValues: ContextValues): ElementIdClass {

  const aliaser = contextValues.get(DefaultNamespaceAliaser);
  const context = contextValues.get(ComponentContext);
  const elementDef = context.get(ElementDef);
  const name: string = elementDef.name ? html__naming.name(elementDef.name, aliaser) : 'component';
  const local = `${name}#${++uniqueClassSeq}`;
  const qualified = ElementIdClass__NS.name(aliaser(ElementIdClass__NS), local, css__naming);
  const element = context.element as Element;

  element.classList.add(qualified);

  return qualified;
}
