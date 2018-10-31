import { StatePath, TypedPropertyDecorator } from '@wesib/wesib';
import { decorateBoundModelProperty } from './bindings';
import { ModelClass } from './model';

export function BindProperty<M extends ModelClass>(opts?: BindProperty.Opts | string):
    TypedPropertyDecorator<M> {
  return <V>(target: InstanceType<M>, key: string | symbol, desc?: TypedPropertyDescriptor<V>) => {

    const { key: elementKey } = parseOpts(target, key, opts);

    return decorateBoundModelProperty({
      target,
      key: key,
      path: [StatePath.property, elementKey],
      desc: desc,
      get(boundTo) {

        const element = boundTo.element as any;

        return element[elementKey];
      },
      set(boundTo, newValue) {

        const element = boundTo.element as any;

        element[elementKey] = newValue;
      },
    });
  };
}

export namespace BindProperty {

  export interface Opts {

    /**
     * DOM property key.
     *
     * Model property name is used by default.
     */
    key?: string | symbol;

  }

}

function parseOpts<M extends ModelClass>(
    target: InstanceType<M>,
    propertyKey: string | symbol,
    opts?: BindProperty.Opts | string) {

  let key: string | symbol;

  if (typeof opts === 'string') {
    key = opts;
  } else if (opts && opts.key) {
    key = opts.key;
  } else {
    key = propertyKey;
  }

  return { key };
}
