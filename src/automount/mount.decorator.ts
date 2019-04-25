import { ComponentClass, ComponentDef, ComponentFactory, TypedClassDecorator } from '@wesib/wesib';
import { AutoMountSupport } from './auto-mount-support.feature';
import { AutoMounter } from './auto-mounter';

/**
 * Creates a decorator causing decorated component to be automatically mounted to the matching element.
 *
 * Enables `AutoMountSupport` feature when applied to component.
 *
 * @param opts Either component auto-mount options, matching element selector, or element predicate function.
 *
 * @returns Component decorator.
 */
export function Mount<T extends ComponentClass = any>(opts: Mount.Opts | Mount.Opts['to']): TypedClassDecorator<T> {
  return (type: T) => {
    return ComponentDef.define(
        type,
        {
          define(definitionContext) {
            definitionContext.get(AutoMounter).register(definitionContext.get(ComponentFactory), opts);
          },
          feature: {
            needs: AutoMountSupport,
          },
        });
  };
}

export namespace Mount {

  /**
   * Component auto-mount options.
   */
  export interface Opts {

    /**
     * A selector of element to automatically mount the component to.
     *
     * This can be:
     * - a CSS selector, or
     * - a function accepting an element as its ony argument and returning `true` for matching elements.
     */
    to: string | ((element: any) => boolean);
  }

}
