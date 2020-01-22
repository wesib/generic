/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { ComponentFactory, ElementAdapter } from '@wesib/wesib';

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
   * Creates element adapter that mounts component to matching element.
   *
   * @param factory  Target component factory.
   * @param def  Either component auto-mount definition, matching element selector, or element predicate function.
   *
   * @returns New element adapter.
   */
  adapter(factory: ComponentFactory, def: MountDef | MountDef['to']): ElementAdapter {

    const to = typeof def === 'object' ? def.to : def;
    const matches: (element: Element) => boolean = typeof to === 'function' ? to : element => element.matches(to);

    return (element: Element) => matches(element) ? factory.mountTo(element).context : undefined;
  },

};
