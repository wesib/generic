/**
 * @module @wesib/generic
 */
import { ComponentClass, ComponentDef, ComponentFactory, ElementAdapter, TypedClassDecorator } from '@wesib/wesib';
import { AutoMountSupport } from './auto-mount-support.feature';
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
  return (type: T) => ComponentDef.define(
      type,
      {
        feature: {
          needs: AutoMountSupport,
          setup(bsSetup) {
            bsSetup.setupDefinition(bsSetup.feature)(defSetup => {
              defSetup.whenReady(defContext => {
                bsSetup.provide({
                  a: ElementAdapter,
                  is: MountDef.adapter(defContext.get(ComponentFactory), def),
                });
              });
            });
          },
        },
      },
  );
}
