import {
  AutoConnectSupport,
  BootstrapContext,
  BootstrapRoot,
  BootstrapWindow,
  Class,
  ElementAdapter,
  FeatureDef,
  FeatureDef__symbol,
} from '@wesib/wesib';
import { AIterable, overArray } from 'a-iterable';
import { DomEventDispatcher } from 'fun-events';
import { AutoMountConfig } from './auto-mount-config';
import { AutoMounter } from './auto-mounter';

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

  static get [FeatureDef__symbol](): FeatureDef {
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
    static get [FeatureDef__symbol]() {
      return def;
    }
  }

  return ConfiguredAutoMountSupport;
}

function featureDef(config: AutoMountConfig = {}): FeatureDef {
  return {
    need: AutoConnectSupport,
    set: [
      { as: AutoMounter },
      {
        a: ElementAdapter,
        by(mounter: AutoMounter): ElementAdapter {
          return (element: any) => mounter.adapt(element);
        },
        with: [AutoMounter],
      }
    ],
    init(context) {
      context.whenReady(() => {
        adaptExistingElement(context, config);
      });
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
