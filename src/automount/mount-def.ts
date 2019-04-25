import { ComponentDef, ComponentFactory } from '@wesib/wesib';
import { AutoMountSupport } from './auto-mount-support.feature';
import { AutoMounter } from './auto-mounter';

/**
 * Component auto-mount definition.
 */
export interface MountDef {

  /**
   * A selector of element to automatically mount the component to.
   *
   * This can be:
   * - a CSS selector, or
   * - a function accepting an element as its ony argument and returning `true` for matching elements.
   */
  readonly to: string | ((element: any) => boolean);

}

export const MountDef = {

  /**
   * Creates a component definition that mounts component to the matching element.
   *
   * The returned component definition enables `AutoMountSupport` feature when applied to component.

   * @param def Either component auto-mount definition, matching element selector, or element predicate function.
   */
  componentDef<T extends object = object>(def: MountDef | MountDef['to']): ComponentDef<T> {
    return {
      define(definitionContext) {
        definitionContext.get(AutoMounter).register(definitionContext.get(ComponentFactory), def);
      },
      feature: {
        needs: AutoMountSupport,
      },
    };
  },

};
