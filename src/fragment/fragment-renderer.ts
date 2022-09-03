import { DrekFragment } from '@frontmeans/drek';
import { ComponentRenderer, ComponentRendererExecution } from '@wesib/wesib';

/**
 * A signature of component fragment renderer.
 *
 * Such renderer is called in pre-rendering phase. It fills the content passed to it via rendering execution context.
 *
 * The rendered content will be placed to the document when ready.
 *
 * @typeParam TExecution - A type of supported fragment renderer execution.
 */
export type FragmentRenderer<
  TExecution extends FragmentRendererExecution = FragmentRendererExecution,
> = ComponentRenderer<TExecution>;

/**
 * Component fragment renderer execution context.
 *
 * This is passed to {@link FragmentRenderer fragment renderer} when the latter executed.
 */
export interface FragmentRendererExecution extends ComponentRendererExecution {
  /**
   * Rendered fragment instance.
   */
  readonly fragment: DrekFragment;

  /**
   * The content of the rendered fragment.
   */
  readonly content: DocumentFragment;

  /**
   * Allows to retain the document content instead of replacing it with pre-rendered one.
   *
   * @param retain - Whether to retain the document content. `true` by default.
   */
  retainContent(retain?: boolean): void;

  /**
   * Stops fragment re-rendering.
   *
   * After calling this method the rendered fragment will be placed to the document once and no further rendering would
   * happen, unless a {@link renderBy} is also called.
   */
  done(this: void): void;
}
