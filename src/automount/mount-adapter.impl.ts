import { ComponentFactory, ElementAdapter } from '@wesib/wesib';
import { MountDef } from './mount-def';

/**
 * @internal
 */
export function mountAdapter(factory: ComponentFactory, opts: MountDef | MountDef['to']): ElementAdapter {

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
