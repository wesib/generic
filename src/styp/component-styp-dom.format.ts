import { stypDomFormat, StypDomFormatConfig, StypFormat } from '@frontmeans/style-producer';
import { ComponentContext } from '@wesib/wesib';
import { componentStypDomFormatConfig } from './component-styp-dom.format-config';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * Component's DOM style production format.
 *
 * Renders CSS styles as text.
 *
 * This format is generally slower than {@link ComponentStypObjectFormat}, but allows to render styles before element
 * is connected to document.
 */
export class ComponentStypDomFormat extends ComponentStypFormat {

  /**
   * When to start component style rendering.
   *
   * One of:
   * `settled` (the default) - to start rendering when component is settled.
   * `connected` - to start rendering when component's element is connected to document.
   */
  readonly when: 'settled' | 'connected';

  /**
   * Constructs DOM style production format.
   *
   * @param context - Target component context.
   * @param when - When to start style rendering. `settled` by default.
   */
  constructor(
      readonly context: ComponentContext,
      {
        when = 'settled',
      }: {
        readonly when?: 'settled' | 'connected';
      } = {},
  ) {
    super();
    this.when = when;
  }

  format(config?: ComponentStypFormatConfig & StypDomFormatConfig): StypFormat {
    return stypDomFormat(this.config(config));
  }

  /**
   * Builds configuration of DOM style production format.
   *
   * This method is called by {@link format} one.
   *
   * @param config - Original component style production format configuration.
   *
   * @returns Configuration of DOM style production format.
   */
  config(
      config?: ComponentStypFormatConfig & StypDomFormatConfig,
  ): StypDomFormatConfig {
    return componentStypDomFormatConfig(this, config, { when: this.when });
  }

}
