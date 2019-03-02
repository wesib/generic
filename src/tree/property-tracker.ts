import { ComponentContext, ComponentState, domPropertyPath } from '@wesib/wesib';
import { EventEmitter, EventProducer, ValueTracker } from 'fun-events';

class PropertyTracker<T> extends ValueTracker<T> {

  private readonly _updates = new EventEmitter<[T, T]>();

  constructor(
      private readonly _element: any,
      private readonly _key: PropertyKey,
      context?: ComponentContext) {
    super();
    if (context) {
      this.bind(context);
    }
  }

  get on(): EventProducer<[T, T]> {
    return this._updates.on;
  }

  bind(context: ComponentContext) {

    const tracker = context.get(ComponentState).track(domPropertyPath(this._key));
    const onUpdate = EventProducer.of(
        (consumer: (newValue: T, oldValue: T) => void) => tracker.onUpdate(
            (_path, newValue: any, oldValue: any) => consumer(newValue, oldValue)));

    onUpdate((...args) => this._updates.notify(...args));
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

  private readonly _props = new Map<PropertyKey, PropertyTracker<any>>();
  private _context?: ComponentContext<any>;

  constructor(private readonly _element: any) {
  }

  bind(context: ComponentContext) {
    this._context = context;
    this._props.forEach(prop => prop.bind(context));
  }

  get<T>(key: PropertyKey): ValueTracker<T> {

    const existing = this._props.get(key);

    if (existing) {
      return existing;
    }

    const created = new PropertyTracker<any>(this._element, key, this._context);

    this._props.set(key, created);

    return created;
  }

}
