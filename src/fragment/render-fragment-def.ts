import { DrekTarget } from '@frontmeans/drek';
import { ComponentContext, RenderDef } from '@wesib/wesib';
import { FragmentRendererExecution } from './fragment-renderer';

/**
 * Fragment rendering definition.
 *
 * This is either a {@link RenderFragmentDef.Spec rendering specifier}, or its provider function.
 */
export type RenderFragmentDef =
    | RenderFragmentDef.Spec
    | RenderDef.Provider<RenderFragmentDef.Spec>;

export namespace RenderFragmentDef {

  /**
   * Component fragment renderer method signature.
   */
  export type Method =
  /**
   * @param execution - Component fragment renderer execution context
   */
      (execution: FragmentRendererExecution) => void;

  /**
   * Fragment rendering specifier.
   */
  export interface Spec extends RenderDef.Spec {

    /**
     * Creates rendering target to place the rendered fragment contents to.
     *
     * By default, the content will be wrapped into element with `display: contents;` CSS style and the wrapper element
     * will be appended to component's content root.
     *
     * @param context - Component context.
     *
     * @returns Rendering target.
     */
    target?(this: void, context: ComponentContext): DrekTarget;

    /**
     * Whether to settle the rendered fragment contents prior to placing them to {@link target}.
     *
     * When enabled custom elements within rendered contents will be [upgraded], then settled by calling
     * `DrekFragment.settle()` method. This allows nested custom elements to render their contents offline into document
     * fragment prior to placing to the document.
     *
     * Enabled (`true`) by default.
     *
     * [upgraded]: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/upgrade
     */
    readonly settle?: boolean;

  }

}
