import { isAfterEvent, trackValue, trackValueBy, ValueTracker } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { AeComponentMember, ComponentClass, ComponentContext, ComponentInstance } from '@wesib/wesib';
import { SharedDef } from './shared.amendment';
import { isSharerAware } from './sharer-aware';

export class ShareAccessor<T, TValue extends SharedDef.Value<T>, TClass extends ComponentClass> {

  private readonly _get: () => TValue;
  private readonly _set: (value: TValue) => void;
  private readonly _ctx: ComponentContext<InstanceType<TClass>>;
  private _valSupply?: Supply;
  readonly val: ValueTracker<T | undefined>;

  constructor(
      target: AeComponentMember<TValue, TClass>,
      component: ComponentInstance<InstanceType<TClass>>,
  ) {
    this._get = target.get.bind(undefined, component);
    this._set = target.writable ? target.set.bind(undefined, component) : noop;
    this._ctx = ComponentContext.of(component);

    const value = this._get();
    let dynSync = false;

    if (isAfterEvent(value)) {
      dynSync = true;
      this.val = trackValueBy(value);
    } else {
      this.val = trackValue(value as T);
    }

    this.val.supply.needs(this._ctx);

    // Inform on sharer as the very first operation
    this.val.read(value => isSharerAware(value) && value.sharedBy(this._ctx));

    if (dynSync) {
      this._syncDyn();
    } else {
      this._syncVal();
    }
  }

  get(): TValue {
    return (this._valSupply ? this.val.it! : this.val.read) as TValue;
  }

  set(value: TValue): void {
    if (isAfterEvent(value)) {
      this.val.by(value);
      this._syncDyn();
    } else {
      this.val.it = value as T;
      this._syncVal();
    }
  }

  private _syncVal(): void {
    if (!this._valSupply) {
      this._valSupply = this.val.read(value => this._set(value as TValue));
    }
  }

  private _syncDyn(): void {
    if (this._valSupply) {
      this._valSupply.off();
      this._valSupply = undefined;
      this._set(this.val.read as TValue);
    }
  }

}
