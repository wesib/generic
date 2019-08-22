/**
 * @module @wesib/generic
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { RefStypRule, StypProperties, StypRule, StypRuleRef, StypRules } from 'style-producer';
import { ThemeStyle } from './theme-style';

const Theme__key = new SingleContextKey<Theme>('theme');

/**
 * A hierarchy of CSS rules within single root.
 *
 * A component may use it to extract styling information.
 *
 * Current theme is available in bootstrap, definition, or component context. By default, only one theme is declared
 * per bootstrap. But this can be overridden.
 */
export abstract class Theme {

  /**
   * A key of bootstrap, definition, or component context value containing current theme instance.
   */
  static get [ContextKey__symbol](): ContextKey<Theme> {
    return Theme__key;
  }

  /**
   * Root CSS rule.
   *
   * All theme styling is represented as rules within this root.
   */
  abstract readonly root: StypRule;

  /**
   * Obtains CSS rule reference by its `referrer`.
   *
   * This is a helper method that resolves the given `referrer` against the `root` CSS rule of this theme.
   *
   * @param referrer  Target CSS rule referrer.
   *
   * @returns CSS rule reference.
   */
  ref<T extends StypProperties<T>>(referrer: RefStypRule<T>): StypRuleRef<T> {
    return referrer(this.root);
  }

  /**
   * Obtains a styling for the given theme styles.
   *
   * This method requests the registered {@link ThemeStyle theme styles} for CSS rules they provide.
   * If some of the styles are not registered then uses the given style as provider.
   *
   * @param styles  The styles to obtain styling information for.
   *
   * @returns Dynamically updated CSS rule set containing the requested styling.
   */
  abstract style(...styles: ThemeStyle.Provider[]): StypRules;

}
