/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { stypDomFormat, StypDomFormatConfig, StypFormat } from '@proc7ts/style-producer';
import {
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
  RenderDef,
} from '@wesib/wesib';
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
   * @param context  Target component context.
   * @param when  When to start style rendering. `settled` by default.
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
   * @param config  Original component style production format configuration.
   *
   * @returns Configuration of DOM style production format.
   */
  config(
      config?: ComponentStypFormatConfig & StypDomFormatConfig,
  ): StypDomFormatConfig {
    return componentStypDomFormatConfig(this, config, { when: this.when });
  }

}

/**
 * Builds configuration of DOM style production format.
 *
 * Schedules style rendering in `ElementRenderScheduler` by default.
 *
 * Utilizes `DefaultNamespaceAliaser` by default.
 *
 * @param format  Target component style production format.
 * @param config  Original component style production format configuration.
 * @param render  Element render definition to apply to style render schedule, unless render scheduler specified
 * explicitly in `config`.
 *
 * @returns Configuration of DOM style production format.
 */
export function componentStypDomFormatConfig(
    format: ComponentStypFormat,
    config: ComponentStypFormatConfig & StypDomFormatConfig = {},
    render?: RenderDef,
): StypDomFormatConfig {

  const { context } = format;

  return {
    ...config,
    document: config.document || context.get(BootstrapWindow).document,
    parent: config.parent || context.contentRoot,
    rootSelector: [],
    scheduler: config.scheduler || defaultStypRenderScheduler(context, render),
    nsAlias: config.nsAlias || context.get(DefaultNamespaceAliaser),
    renderer: format.renderer(config),
  };
}

/**
 * @internal
 */
function defaultStypRenderScheduler(
    context: ComponentContext,
    render: RenderDef = {},
): ElementRenderScheduler {

  const scheduler = context.get(ElementRenderScheduler);

  return (opts = {}) => scheduler({ ...opts, ...render });
}
