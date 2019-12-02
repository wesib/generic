import { ComponentContext, ComponentState, domPropertyPathTo } from '@wesib/wesib';
import { EventEmitter, eventSupply, noEventSupply, OnEvent, ValueTracker } from 'fun-events';

class PropertyTracker<T> extends ValueTracker<T> {

  private readonly _updates = new EventEmitter<[T, T]>();
  private _supply = noEventSupply();

  constructor(
      private readonly _element: any,
      private readonly _key: PropertyKey) {
    super();
  }

  get on(): OnEvent<[T, T]> {
    return this._updates.on;
  }

  bind(context: ComponentContext) {

    const propertyState = context.get(ComponentState).track(domPropertyPathTo(this._key));

    this._supply = propertyState.onUpdate({
      supply: eventSupply().whenOff(reason => this._updates.done(reason)),
      receive: (_ctx, _path, newValue: any, oldValue: any) => this._updates.send(newValue, oldValue),
    });
  }

  get it(): T {
    return this._element[this._key];
  }

  set it(value: T) {
    this._element[this._key] = value;
  }

  done(reason?: any): this {
    this._supply.off(reason);
    return this;
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

    const created = new PropertyTracker<any>(this._element, key);

    if (this._context) {
      created.bind(this._context);
    }
    this._props.set(key, created);

    return created;
  }

}
