import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import {
  AeComponentMember,
  ComponentClass,
  ComponentContext,
  ComponentInstance,
} from '@wesib/wesib';
import { shareValueBy } from './sharer-aware';

export class ShareAccessor<T, TClass extends ComponentClass> {

  private readonly _get: () => T | undefined;
  private readonly _set: (value: T | undefined) => void;
  private readonly _ctx: ComponentContext<InstanceType<TClass>>;
  private _valSupply?: Supply | undefined;
  readonly val: ValueTracker<T | undefined>;

  constructor(
    target: AeComponentMember<T | undefined, TClass>,
    component: ComponentInstance<InstanceType<TClass>>,
  ) {
    this._get = target.get.bind(undefined, component);
    this._set = target.writable ? target.set.bind(undefined, component) : noop;
    this._ctx = ComponentContext.of(component);

    const value = this._get();

    this.val = trackValue(value as T);
    this.val.supply.needs(this._ctx);

    // Inform on sharer as the very first operation.
    this.val.read(value => shareValueBy(this._ctx, value));

    this._syncVal();
  }

  get(): T | undefined {
    return this.val.it;
  }

  set(value: T | undefined): void {
    this.val.it = value as T;
    this._syncVal();
  }

  private _syncVal(): void {
    if (!this._valSupply) {
      this._valSupply = this.val.read(value => this._set(value));
    }
  }

}
