import { BootstrapContext } from '@wesib/wesib';
import { OnEvent, onEventBy, ValueTracker } from 'fun-events';
import { AttributesObserver } from './attributes-observer';

class AttributeTracker extends ValueTracker<string | null, string> {

  readonly on: OnEvent<[string, string | null]>;

  constructor(
      bs: BootstrapContext,
      private readonly _element: any,
      private readonly _name: string) {
    super();

    const observer = bs.get(AttributesObserver);

    this.on = onEventBy(receiver => observer.observe(_element, _name, receiver));
  }

  get it(): string | null {
    return this._element.getAttribute(this._name);
  }

  set it(value: string | null) {
    this._element.setAttribute(this._name, value);
  }

}

/**
 * @internal
 */
export class NodeAttributes {

  private readonly _attrs = new Map<string, AttributeTracker>();

  constructor(private readonly _bs: BootstrapContext, private readonly _element: any) {
  }

  get(name: string): ValueTracker<string | null, string> {

    const existing = this._attrs.get(name);

    if (existing) {
      return existing;
    }

    const created = new AttributeTracker(this._bs, this._element, name);

    this._attrs.set(name, created);

    return created;
  }

}
