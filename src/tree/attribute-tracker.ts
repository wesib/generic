import { ContextValues } from 'context-values';
import { EventProducer, ValueTracker } from 'fun-events';
import { AttributesObserver } from './attributes-observer';

class AttributeTracker extends ValueTracker<string | null, string> {

  readonly on: EventProducer<(this: void, newValue: string, oldValue: string | null) => void>;

  constructor(
      context: ContextValues,
      private readonly _element: any,
      private readonly _name: string) {
    super();

    const observer = context.get(AttributesObserver);

    this.on = EventProducer.of(consumer => observer.observe(_name, consumer));
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

  constructor(
      private readonly _context: ContextValues,
      private readonly _element: any) {}

  get(name: string): ValueTracker<string | null, string> {

    const existing = this._attrs.get(name);

    if (existing) {
      return existing;
    }

    const created = new AttributeTracker(this._context, this._element, name);

    this._attrs.set(name, created);

    return created;
  }

}
