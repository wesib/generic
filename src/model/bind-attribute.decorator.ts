import { TypedPropertyDecorator } from '@wesib/wesib';
import { StatePath } from 'fun-events';
import { decorateBoundModelProperty } from './bindings';
import { ModelClass } from './model';

export function BindAttribute<M extends ModelClass>(opts?: BindAttribute.Opts | string):
    TypedPropertyDecorator<M> {
  return <V>(target: InstanceType<M>, key: string | symbol, desc?: TypedPropertyDescriptor<V>) => {

    const { name: attributeName } = parseOpts(target, key, opts);

    return decorateBoundModelProperty({
      target,
      key: key,
      path: StatePath.ofAttribute(attributeName),
      desc: desc,
      get(boundTo) {

        const element = boundTo.element as HTMLElement;

        return element.getAttribute(attributeName);
      },
      set(boundTo, newValue) {

        const element = boundTo.element as HTMLElement;

        element.setAttribute(attributeName, newValue);
      },
      init(boundTo, initial) {

        const element = boundTo.element as HTMLElement;
        const attrValue = element.getAttribute(attributeName);

        if (attrValue != null) {
          // Attribute is present. Replace model value with attribute's one
          (target as any)[key] = attrValue;
        } else {
          // Attribute is absent. Apply model value
          element.setAttribute(attributeName, initial);
        }
      },
    });
  };
}

export namespace BindAttribute {

  export interface Opts {

    /**
     * Attribute name.
     *
     * This is required if annotated property's key is not a string (i.e. a symbol). Otherwise,
     * the attribute name is equal to the property name by default.
     */
    name?: string;

  }

}

function parseOpts<M extends ModelClass>(
    target: InstanceType<M>,
    propertyKey: string | symbol,
    opts?: BindAttribute.Opts | string) {

  let name: string;

  if (typeof opts === 'string') {
    name = opts;
  } else if (opts && opts.name) {
    name = opts.name;
  } else if (typeof propertyKey !== 'string') {
    throw new TypeError(
        `Model property key (${target.constructor.name}.${propertyKey.toString()}) is not a string. `
        + 'Attribute name is required');
  } else {
    name = propertyKey;
  }

  return { name };
}
