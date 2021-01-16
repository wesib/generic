/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { isQualifiedName, QualifiedName } from '@frontmeans/namespace-aliaser';
import { valueProvider } from '@proc7ts/primitives';
import { ComponentBinder, ComponentElement, DefinitionContext } from '@wesib/wesib';

/**
 * Component auto-mount definition.
 */
export interface MountDef {

  /**
   * A name of the element to automatically mount the component to.
   */
  readonly to: QualifiedName;

  /**
   * Detects whether to mount to the given element.
   *
   * @param element - Target element with matching {@link to name}.
   *
   * @returns `true` to mount the component to the given element, or `false` otherwise.
   */
  when?(element: ComponentElement): boolean;

}

export const MountDef = {

  /**
   * Creates a component binder that mounts component to matching element.
   *
   * @param defContext - Target component definition context.
   * @param def - Either component auto-mount definition, matching element selector, or element predicate function.
   *
   * @returns New component binder.
   */
  binder(defContext: DefinitionContext, def: MountDef | QualifiedName): ComponentBinder {

    let to: QualifiedName;
    let when: (element: ComponentElement) => boolean;

    if (isQualifiedName(def)) {
      to = def;
      when = valueProvider(true);
    } else {
      to = def.to;
      when = def.when ? def.when.bind(def) : valueProvider(true);
    }

    return {
      to,
      bind(element: ComponentElement) {
        if (when(element)) {
          defContext.mountTo(element);
        }
      },
    };
  },

};
