/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { StypFormat, stypObjectFormat, StypObjectFormatConfig } from '@proc7ts/style-producer';
import { ComponentContext } from '@wesib/wesib';
import { componentStypDomFormatConfig } from './component-styp-dom.format';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * Component's CSS object model production format.
 *
 * Renders CSS when component's element connected to document.
 *
 * This format is used by default.
 */
export class ComponentStypObjectFormat extends ComponentStypFormat {

  /**
   * Constructs CSS object model production format.
   *
   * @param context  Target component context.
   */
  constructor(readonly context: ComponentContext) {
    super();
  }

  format(config?: ComponentStypFormatConfig & StypObjectFormatConfig): StypFormat {
    return stypObjectFormat(this.config(config));
  }

  /**
   * Builds configuration of CSS object model production format.
   *
   * This method is called by {@link format} one.
   *
   * @param config  Original component style production format configuration.
   *
   * @returns Configuration of CSS object model production format.
   */
  config(config?: ComponentStypFormatConfig & StypObjectFormatConfig): StypObjectFormatConfig {
    return componentStypDomFormatConfig(this, config);
  }

}
