import { ComponentContext, ElementDef } from '@wesib/wesib';
import { ContextRequest, ContextTarget, ContextValues, SingleContextKey } from 'context-values';

/**
 * @internal
 */
export type UniqueElementClass = string;

/**
 * @internal
 */
export const UniqueElementClass: ContextTarget<UniqueElementClass> & ContextRequest<UniqueElementClass> =
    /*#__PURE__*/ new SingleContextKey<UniqueElementClass>('unique-element-class', assignUniqueClass);

let uniqueClassSeq = 0;

function assignUniqueClass(contextValues: ContextValues) {

  const context = contextValues.get(ComponentContext);
  const elementDef = context.get(ElementDef);
  const name = elementDef.name || 'component';
  const className = `wesib:${name}#${++uniqueClassSeq}`;

  const element = context.element as Element;

  element.classList.add(className);

  return className;
}
