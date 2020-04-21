/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { EventSupply, eventSupply } from '@proc7ts/fun-events';
import { stypDomFormat, StypDomFormatConfig, StypFormat, StypRules } from '@proc7ts/style-producer';
import { BootstrapWindow, ComponentContext, DefaultNamespaceAliaser, DefaultRenderScheduler } from '@wesib/wesib';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * Component's DOM style production format.
 *
 * Renders CSS styles as text.
 *
 * This format is generally slower than {@link ComponentStypObjectFormat}, but allows to render style for disconnected
 * element.
 */
export class ComponentStypDomFormat extends ComponentStypFormat {

  /**
   * Whether to render component style while it is offline.
   */
  readonly offline: boolean;

  /**
   * Constructs DOM style production format.
   *
   * @param context  Target component context.
   * @param offline  Whether to render component style while it is offline. `true` by default.
   */
  constructor(
      readonly context: ComponentContext,
      {
        offline = true,
      }: {
        readonly offline?: boolean;
      } = {},
  ) {
    super();
    this.offline = offline;
  }

  produce(rules: StypRules.Source, config?: ComponentStypFormatConfig): EventSupply {

    const producer = this.newProducer(rules, config);
    const supply = eventSupply();
    const doProduce = (): void => {
      producer().needs(supply).cuts(supply);
    };

    if (this.offline) {
      this.context.whenReady(doProduce);
    } else {
      this.context.whenConnected(doProduce);
    }

    return supply;
  }

  format(config?: ComponentStypFormatConfig & StypDomFormatConfig): StypFormat {
    return stypDomFormat(this.config(config));
  }

  /**
   * Builds configuration of DOM style production format.
   *
   * This method is called by {@link format} one.
   *
   * @param config  Original component style production format configuration.
   *
   * @returns Configuration of DOM style production format.
   */
  config(
      config?: ComponentStypFormatConfig & StypDomFormatConfig,
  ): StypDomFormatConfig {
    return componentStypDomFormatConfig(this, config);
  }

}

/**
 * Builds configuration of DOM style production format.
 *
 * @param format  Target component style production format.
 * @param config  Original component style production format configuration.
 *
 * @returns Configuration of DOM style production format.
 */
export function componentStypDomFormatConfig(
    format: ComponentStypFormat,
    config: ComponentStypFormatConfig & StypDomFormatConfig = {},
): StypDomFormatConfig {

  const { context } = format;

  return {
    ...config,
    document: config.document || context.get(BootstrapWindow).document,
    parent: config.parent || context.contentRoot,
    rootSelector: [],
    scheduler: config.scheduler || context.get(DefaultRenderScheduler),
    nsAlias: config.nsAlias || context.get(DefaultNamespaceAliaser),
    renderer: format.renderer(config),
  };
}
