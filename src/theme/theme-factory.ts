import { ContextKey, SingleContextKey } from 'context-values';
import { Theme } from './theme';

const ThemeFactory__key = new SingleContextKey<ThemeFactory>('theme-factory');

export abstract class ThemeFactory {

  static get key(): ContextKey<ThemeFactory> {
    return ThemeFactory__key;
  }

  abstract newTheme(): Theme;

}
