import { ThemeFactory as ThemeFactory_ } from './theme-factory';
import { ThemeStyle } from './theme-style';
import { Theme } from './theme.impl';

/**
 * @internal
 */
export class ThemeFactory extends ThemeFactory_ {

  constructor(private readonly _styles: ThemeStyle.ById) {
    super();
  }

  newTheme() {
    return new Theme(this._styles);
  }

}
