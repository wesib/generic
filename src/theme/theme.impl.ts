import { lazyStypRules, stypRoot, StypRule, StypRules } from 'style-producer';
import { Theme as Theme_ } from './theme';
import { ThemeStyle } from './theme-style';

/**
 * @internal
 */
export class Theme extends Theme_ {

  readonly root: StypRule = stypRoot();
  private readonly _rules = new Map<ThemeStyle.Provider, StypRules>();

  constructor(private readonly _styles: ThemeStyle.ById) {
    super();
  }

  style(...styles: ThemeStyle.Provider[]): StypRules {

    const theme = this;

    return lazyStypRules(...styles.reduce<StypRules[]>(addStyleRules, []));

    function addStyleRules(target: StypRules[], style: ThemeStyle.Provider): StypRules[] {

      const existing = theme._rules.get(style);

      if (existing) {
        target.push(existing);
      } else {

        const constructed = theme._styles(style)(theme);

        theme._rules.set(style, constructed);
        target.push(constructed);
      }

      return target;
    }
  }

}
