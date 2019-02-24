import {
  AutoConnectSupport,
  BootstrapContext,
  BootstrapRoot,
  BootstrapWindow,
  Class,
  ElementAdapter,
  FeatureDef,
  featureDefSymbol,
} from '@wesib/wesib';
import { AIterable, overArray } from 'a-iterable';
import { DomEventDispatcher } from 'fun-events';
import { AutoMountConfig } from './auto-mount-config';

let DEF: FeatureDef | undefined;

/**
 * Auto-mount support feature.
 *
 * Automatically mounts components decorated with `@Mount()` decorator.
 *
 * Can be applied directly, or using `autoMountSupport()` function when custom auto-mount configuration is reqiored.
 *
 * Requires `AutoConnectSupport` feature.
 *
 * Automatically enabled by `@Mount()` decorator.
 */
export class AutoMountSupport {

  static get [featureDefSymbol](): FeatureDef {
    return DEF || (DEF = featureDef());
  }

}

/**
 * Configures auto-mount support.
 *
 * Constructs an `AutoMountSupport` feature replacement with auto-mount configuration applied.
 *
 * @param config Custom auto-mount configuration option.
 *
 * @returns Configured auto-mount support feature.
 */
export function autoMountSupport(config?: AutoMountConfig): Class {

  const def: FeatureDef = {
    ...featureDef(config),
    has: AutoMountSupport,
  };

  class ConfiguredAutoMountSupport {
    static get [featureDefSymbol]() {
      return def;
    }
  }

  return ConfiguredAutoMountSupport;
}

function featureDef(config: AutoMountConfig = {}): FeatureDef {
  return {
    need: AutoConnectSupport,
    init(context) {
      adaptExistingElement(context, config);
    },
  };
}

function adaptExistingElement(context: BootstrapContext, { select = '*' }: AutoMountConfig) {
  if (!select) {
    return; // Initial auto-mount disabled.
  }

  const selector = select === true ? '*' : select;
  const root: Element = context.get(BootstrapRoot);
  const adapter = context.get(ElementAdapter);
  const document = context.get(BootstrapWindow).document;

  if (document.readyState === 'loading') {
    new DomEventDispatcher(document).on('DOMContentLoaded').once(adapt);
  } else {
    adapt();
  }

  function adapt() {
    AIterable.from(overArray(root.querySelectorAll(selector)))
        .forEach(element => adapter(element));
  }
}