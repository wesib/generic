import { stypRules, StypRules } from '@frontmeans/style-producer';
import { ContextRef, ContextValueSlot, IterativeContextKey } from '@proc7ts/context-values';
import { itsEach } from '@proc7ts/push-iterator';
import { Theme } from './theme';

/**
 * Theme style provides part of the theme styling information.
 *
 * Theme style(s) can be provided in bootstrap context. They are applied to the theme at most once, when requested
 * by calling {@link Theme.style} method.
 *
 * Theme style is either a function, or an extension of another theme style.
 */
export type ThemeStyle = ThemeStyle.Provider | ThemeStyle.Extension;

export namespace ThemeStyle {

  /**
   * Theme style provider function.
   *
   * This function is called at most once per theme to apply styles to the latter. E.g. by declaring CSS rules.
   *
   * This function is used as an identifier of particular style and can be extended using {@link ThemeStyle.Extension}.
   *
   * It is not absolutely necessary to register style provider. It will be applied on request anyway.
   *
   * @param theme - A theme to apply styling to.
   *
   * @returns Dynamically updated CSS rule set containing the applied styling.
   */
  export type Provider = (this: void, theme: Theme) => StypRules;

  /**
   * Theme style extension.
   *
   * An extension should be registered in bootstrap context in order to be applied.
   */
  export interface Extension {

    /**
     * A theme style provider to extend.
     */
    readonly style: ThemeStyle.Provider;

    /**
     * Extends the theme style.
     *
     * This method is called at most once per theme to apply styles to the latter. E.g. by declaring CSS rules.
     *
     * It will be called after the style provider it extends.
     *
     * @param theme - A theme to apply styling to.
     *
     * @returns Dynamically updated CSS rule set containing the applied styling.
     */
    provide(theme: Theme): StypRules;

  }

  /**
   * A function obtaining combined style provider. I.e. the one that applies the style along with all extensions.
   *
   * @param A - provider of theme style to apply.
   *
   * @returns A combined theme style provider.
   */
  export type ById = (this: void, style: ThemeStyle.Provider) => ThemeStyle.Provider;

}

/**
 * @internal
 */
class ThemeStyleKey extends IterativeContextKey<ThemeStyle.ById, ThemeStyle> {

  constructor() {
    super('theme-style');
  }

  grow(
      slot: ContextValueSlot<ThemeStyle.ById, ThemeStyle, Iterable<ThemeStyle>>,
  ): void {

    const providers = new Map<ThemeStyle.Provider, [ThemeStyle.Provider, boolean]>();

    itsEach(
        slot.seed,
        style => {

          let key: ThemeStyle.Provider;
          let provider: ThemeStyle.Provider;
          let isId: boolean;

          if (typeof style === 'function') {
            key = provider = style;
            isId = true;
          } else {
            key = style.style;
            provider = style.provide.bind(style);
            isId = false;
          }

          const prev = providers.get(key);

          if (!prev) {
            providers.set(key, [provider, isId]);
          } else {

            const [prevProvider, hasId] = prev;

            providers.set(
                key,
                [
                  isId ? combineStyles(provider, prevProvider) : combineStyles(prevProvider, provider),
                  isId || hasId,
                ],
            );
          }
        },
    );

    if (providers.size || !slot.hasFallback) {
      slot.insert(byId);
    }

    function byId(id: ThemeStyle.Provider): ThemeStyle.Provider {

      const existing = providers.get(id);

      if (!existing) {
        return id;
      }

      const [provider, hasId] = existing;

      return hasId ? provider : combineStyles(id, provider);
    }
  }

}

/**
 * A key of bootstrap context value containing theme styles.
 */
export const ThemeStyle: ContextRef<ThemeStyle.ById, ThemeStyle> = (/*#__PURE__*/ new ThemeStyleKey());

/**
 * @internal
 */
function combineStyles(first: ThemeStyle.Provider, second: ThemeStyle.Provider): ThemeStyle.Provider {
  return theme => stypRules(first(theme), second(theme));
}
