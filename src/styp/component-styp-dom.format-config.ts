/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { StypDomFormatConfig } from '@frontmeans/style-producer';
import {
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
  RenderDef,
} from '@wesib/wesib';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

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
