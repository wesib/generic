import { BootstrapContext } from '@wesib/wesib';
import { EventEmitter, noEventInterest, OnEvent, onEventBy, ValueTracker, eventInterest } from 'fun-events';
import { AttributesObserver } from './attributes-observer';

class AttributeTracker extends ValueTracker<string | null, string> {

  private readonly _updates = new EventEmitter<[string, string | null]>();
  readonly on: OnEvent<[string, string | null]>;

  constructor(
      bs: BootstrapContext,
      private readonly _element: any,
      private readonly _name: string) {
    super();

    const observer = bs.get(AttributesObserver);
    let observeInterest = noEventInterest();

    this.on = onEventBy(receiver => {
      if (!this._updates.size) {
        observeInterest = observer.observe(_element, _name, (newValue, oldValue) => {
          this._updates.send(newValue, oldValue);
        });
      }

      const interest = this._updates.on(receiver);

      return eventInterest(reason => {
        interest.off(reason);
        if (!this._updates.size) {
          observeInterest.off(reason);
          observeInterest = noEventInterest();
        }
      }).needs(interest).needs(observeInterest);
    });
  }

  get it(): string | null {
    return this._element.getAttribute(this._name);
  }

  set it(value: string | null) {
    this._element.setAttribute(this._name, value);
  }

  clear(reason?: any): this {
    this._updates.clear(reason);
    return this;
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
