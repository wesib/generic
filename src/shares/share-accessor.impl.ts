import { Contextual__symbol, isContextual } from '@proc7ts/context-values';
import { AfterEvent, isAfterEvent, trackValue, trackValueBy, ValueTracker } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentClass, ComponentContext, ComponentInstance, ComponentProperty } from '@wesib/wesib';

/**
 * @internal
 */
export class ShareAccessor<T, TClass extends ComponentClass> {

  private readonly _get: () => T | AfterEvent<[T?]>;
  private readonly _set: (value: T | AfterEvent<[T?]>) => void;
  private readonly _ctx: ComponentContext<InstanceType<TClass>>;
  private _valSupply?: Supply;
  readonly val: ValueTracker<T | undefined>;

  constructor(
      desc: ComponentProperty.Descriptor<T | AfterEvent<[T?]>, TClass>,
      component: ComponentInstance<InstanceType<TClass>>,
  ) {
    this._get = desc.get.bind(undefined, component);
    this._set = desc.writable ? desc.set.bind(undefined, component) : noop;
    this._ctx = ComponentContext.of(component);

    const value = this._get();
    let dynSync = false;

    if (isAfterEvent(value)) {
      dynSync = true;
      this.val = trackValueBy(value);
    } else {
      this.val = trackValue(value);
    }

    this.val.supply.needs(this._ctx);

    // Bind to context as the very first operation
    this.val.read(value => isContextual(value) && value[Contextual__symbol](this._ctx));

    if (dynSync) {
      this._syncDyn();
    } else {
      this._syncVal();
    }
  }

  get(): T | AfterEvent<[T?]> {
    return this._valSupply ? this.val.it! : this.val.read;
  }

  set(value: T | AfterEvent<[T?]>): void {
    if (isAfterEvent(value)) {
      this.val.by(value);
      this._syncDyn();
    } else {
      this.val.it = value;
      this._syncVal();
    }
  }

  private _syncVal(): void {
    if (!this._valSupply) {
      this._valSupply = this.val.read(value => this._set(value!));
    }
  }

  private _syncDyn(): void {
    if (this._valSupply) {
      this._valSupply.off();
      this._valSupply = undefined;
      this._set(this.val.read);
    }
  }

}
