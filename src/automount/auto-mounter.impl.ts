import { ComponentContext, ComponentFactory, ElementAdapter } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { MountDef } from './mount-def';

const AutoMounter__key = /*#__PURE__*/ new SingleContextKey<AutoMounter>('auto-mounter');

/**
 * @internal
 */
export class AutoMounter {

  private readonly _adapters: ElementAdapter[] = [];

  static get [ContextKey__symbol](): ContextKey<AutoMounter> {
    return AutoMounter__key;
  }

  register(factory: ComponentFactory, opts: MountDef | MountDef['to']) {
    this._adapters.push(mountAdapter(factory, opts));
  }

  adapt(element: Element): ComponentContext<any> | undefined {
    for (const adapter of this._adapters) {

      const context = adapter(element);

      if (context) {
        return context;
      }
    }

    return;
  }

}

function mountAdapter(factory: ComponentFactory, opts: MountDef | MountDef['to']): ElementAdapter {

  const matches = elementMatcher(opts);

  return (element: Element) => {
    if (!matches(element)) {
      return;
    }
    return factory.mountTo(element).context;
  };
}

function elementMatcher(opts: MountDef | MountDef['to']): (element: Element) => boolean {

  const to = typeof opts === 'object' ? opts.to : opts;

  if (typeof to === 'function') {
    return to;
  }

  return element => element.matches(to);
}
