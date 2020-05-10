import { ThemeFactory } from './theme-factory';
import { ThemeStyle } from './theme-style';
import { Theme$ } from './theme.impl';

/**
 * @internal
 */
export class ThemeFactory$ extends ThemeFactory {

  constructor(private readonly _styles: ThemeStyle.ById) {
    super();
  }

  newTheme(): Theme$ {
    return new Theme$(this._styles);
  }

}
