import { ContextValues } from 'context-values';
import { EventProducer, StatePath, StateTracker, ValueTracker } from 'fun-events';

class PropertyTracker<T> extends ValueTracker<T> {

  readonly on: EventProducer<[T, T]>;

  constructor(
      context: ContextValues,
      private readonly _element: any,
      private readonly _key: PropertyKey) {
    super();

    const tracker = context.get(StateTracker).track(StatePath.ofProperty(_key));

    this.on = EventProducer.of(
        (consumer: (newValue: T, oldValue: T) => void) => tracker.onUpdate(
            (_path, newValue: any, oldValue: any) => consumer(newValue, oldValue)));
  }

  get it(): T {
    return this._element[this._key];
  }

  set it(value: T) {
    this._element[this._key] = value;
  }

}

/**
 * @internal
 */
export class NodeProperties {

  private readonly _attrs = new Map<PropertyKey, PropertyTracker<any>>();

  constructor(
      private readonly _context: ContextValues,
      private readonly _element: any) {}

  get<T>(key: PropertyKey): ValueTracker<T> {

    const existing = this._attrs.get(key);

    if (existing) {
      return existing;
    }

    const created = new PropertyTracker<any>(this._context, this._element, key);

    this._attrs.set(key, created);

    return created;
  }

}
