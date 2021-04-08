import { DrekFragmentRenderExecution } from '@frontmeans/drek';
import { ComponentRenderer, ComponentRendererExecution } from '@wesib/wesib';

/**
 * A signature of component fragment renderer.
 *
 * Such renderer is called in pre-rendering phase. It fills the content passed to it via execution context.
 *
 * The rendered content will be placed to the document later.
 *
 * @typeParam TExecution - A type of supported fragment renderer execution.
 */
export type FragmentRenderer<TExecution extends FragmentRendererExecution = FragmentRendererExecution> =
    ComponentRenderer<TExecution>;

/**
 * Component fragment renderer execution context.
 *
 * This is passed to {@link FragmentRenderer fragment renderer} when the latter executed.
 */
export interface FragmentRendererExecution extends ComponentRendererExecution, DrekFragmentRenderExecution {

  /**
   * Stops fragment re-rendering.
   *
   * After calling this method the rendered fragment will be placed to the document once. No further rendering would
   * happen, unless a {@link renderBy} is also called.
   */
  done(this: void): void;

}
