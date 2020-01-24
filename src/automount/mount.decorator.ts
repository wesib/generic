/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { Component, ComponentClass, ComponentDecorator, ComponentFactory, ElementAdapter } from '@wesib/wesib';
import { AutoMountSupport } from './auto-mount-support.feature';
import { MountDef } from './mount-def';

/**
 * Creates a decorator causing decorated component to automatically mount to the matching element.
 *
 * Enables a {@link MountDef.adapter mount adapter} for decorated component.
 *
 * Enables [[AutoMountSupport]] feature when applied to component.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Either component auto-mount definition, matching element selector, or element predicate function.
 *
 * @returns New component decorator.
 */
export function Mount<T extends ComponentClass = any>(def: MountDef | MountDef['to']): ComponentDecorator<T> {
  return Component({
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
  });
}
