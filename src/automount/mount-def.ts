/**
 * @module @wesib/generic
 */
import { BootstrapSetup, ComponentDef, ComponentFactory, ElementAdapter } from '@wesib/wesib';
import { AutoMountSupport } from './auto-mount-support.feature';
import { mountAdapter } from './mount-adapter.impl';

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
   * Builds component definition that mounts component to the matching element.
   *
   * The returned component definition enables [[AutoMountSupport]] feature when applied to component.
   *
   * @typeparam T  A type of component.
   * @param def  Either component auto-mount definition, matching element selector, or element predicate function.
   *
   * @returns New component definition.
   */
  componentDef<T extends object>(
      def: MountDef | MountDef['to'],
  ): ComponentDef<T> {

    let bsSetup: BootstrapSetup;

    return {
      define(context) {
        bsSetup.provide({
          a: ElementAdapter,
          is: mountAdapter(context.get(ComponentFactory), def),
        });
      },
      feature: {
        needs: AutoMountSupport,
        setup(setup) {
          bsSetup = setup;
        },
      },
    };
  },

};
