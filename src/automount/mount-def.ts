/**
 * @module @wesib/generic
 */
import { ComponentClass, ComponentDef, ComponentFactory, ElementAdapter, FeatureContext } from '@wesib/wesib';
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
   * Enhances component definition to mount component to the matching element.
   *
   * The returned component definition enables [[AutoMountSupport]] feature when applied to component.
   *
   * @typeparam T  A type of component.
   * @param componentType  Component class constructor.
   * @param def  Either component auto-mount definition, matching element selector, or element predicate function.
   */
  define<T extends ComponentClass>(
      componentType: T,
      def: MountDef | MountDef['to'],
  ): T {

    let featureContext: FeatureContext | undefined;
    let componentFactory: ComponentFactory | undefined;

    const provideAdapter = () => {
      if (featureContext && componentFactory) {
        featureContext.provide({ a: ElementAdapter, is: mountAdapter(componentFactory, def) });
      }
    };

    return ComponentDef.define(
        componentType,
        {
          define(definitionContext) {
            componentFactory = definitionContext.get(ComponentFactory);
            provideAdapter();
          },
          feature: {
            needs: AutoMountSupport,
            init(context) {
              featureContext = context;
              provideAdapter();
            },
          },
        },
    );
  },

};
