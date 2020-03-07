import { ComponentContext, ComponentState, domPropertyPathTo } from '@wesib/wesib';
import { EventEmitter, EventSupply, eventSupply, EventSupply__symbol, OnEvent, ValueTracker } from 'fun-events';

/**
 * @internal
 */
class PropertyTracker<T> extends ValueTracker<T> {

  private readonly _updates = new EventEmitter<[T, T]>();
  private readonly _supply = eventSupply();

  constructor(
      private readonly _element: any,
      private readonly _key: PropertyKey,
  ) {
    super();
  }

  get on(): OnEvent<[T, T]> {
    return this._updates.on;
  }

  get [EventSupply__symbol](): EventSupply {
    return this._supply;
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

  bind(context: ComponentContext): void {

    const propertyState = context.get(ComponentState).track(domPropertyPathTo(this._key));

    propertyState.onUpdate.tillOff(this)({
      supply: eventSupply()
          .cuts(this._updates)
          .cuts(this),
      receive: (_ctx, _path, newValue: any, oldValue: any) => this._updates.send(newValue, oldValue),
    });
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

  bind(context: ComponentContext): void {
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
