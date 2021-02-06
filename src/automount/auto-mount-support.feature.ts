import { DomEventDispatcher } from '@frontmeans/dom-events';
import { onceOn } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import { itsEach, overArray } from '@proc7ts/push-iterator';
import {
  BootstrapContext,
  BootstrapRoot,
  BootstrapWindow,
  ElementAdapter,
  FeatureContext,
  FeatureDef,
  FeatureDef__symbol,
} from '@wesib/wesib';
import { AutoMountConfig } from './auto-mount-config';

/**
 * @internal
 */
let AutoMountSupport__feature: FeatureDef | undefined;

/**
 * Auto-mount support feature.
 *
 * Automatically mounts components decorated with {@link Mount @Mount} decorator.
 *
 * Can be applied directly, or using {@link autoMountSupport} function when custom auto-mount configuration is required.
 *
 * Does not track DOM mutations. To do that either enable `AutoConnectSupport`, or apply `ElementAdapter` to added
 * elements. E.g. by utilizing `ElementObserver`.
 *
 * Automatically enabled by {@link Mount @Mount} decorator.
 */
export class AutoMountSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return AutoMountSupport__feature || (AutoMountSupport__feature = autoMountFeatureDef());
  }

}

/**
 * Configures auto-mount support.
 *
 * Constructs an {@link AutoMountSupport} feature replacement with auto-mount configuration applied.
 *
 * @param config - Custom auto-mount configuration option.
 *
 * @returns Configured auto-mount support feature.
 */
export function autoMountSupport(config?: AutoMountConfig): Class {

  const def: FeatureDef = {
    ...autoMountFeatureDef(config),
    has: AutoMountSupport,
  };

  class ConfiguredAutoMountSupport {

    static get [FeatureDef__symbol](): FeatureDef {
      return def;
    }

  }

  return ConfiguredAutoMountSupport;
}

/**
 * @internal
 */
function autoMountFeatureDef(config: AutoMountConfig = {}): FeatureDef.Options {
  return {
    setup(setup) {
      setup.whenReady(context => {
        context.get(BootstrapContext).whenReady(() => {
          // Await for mount definitions registration.
          Promise.resolve()
              .then(() => mountExistingElements(context, config))
              .catch(console.error);
        });
      });
    },
  };
}

/**
 * @internal
 */
function mountExistingElements(context: FeatureContext, { select = '*' }: AutoMountConfig): void {
  if (!select) {
    return; // Initial auto-mount disabled.
  }

  const selector = select === true ? '*' : select;
  const root = context.get(BootstrapRoot);
  const adapter = context.get(ElementAdapter);
  const document = context.get(BootstrapWindow).document;
  const adapt = (): void => {
    itsEach(
        overArray(root.querySelectorAll(selector)),
        element => adapter(element),
    );
  };

  if (document.readyState === 'loading') {
    new DomEventDispatcher(document).on('DOMContentLoaded').do(onceOn)(adapt);
  } else {
    adapt();
  }
}
