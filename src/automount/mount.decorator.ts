/**
 * @module @wesib/generic
 */
import { ComponentClass, TypedClassDecorator } from '@wesib/wesib';
import { MountDef } from './mount-def';

/**
 * Creates a decorator causing decorated component to be automatically mounted to the matching element.
 *
 * Enables [[AutoMountSupport]] feature when applied to component.
 *
 * Applies component definition constructed by [[MountDef.componentDef]] function
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Either component auto-mount definition, matching element selector, or element predicate function.
 *
 * @returns Component decorator.
 */
export function Mount<T extends ComponentClass = any>(def: MountDef | MountDef['to']): TypedClassDecorator<T> {
  return (type: T) => MountDef.define(type, def);
}
