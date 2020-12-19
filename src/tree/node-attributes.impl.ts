import { EventEmitter, eventReceiver, EventReceiver, OnEvent, onEventBy, ValueTracker } from '@proc7ts/fun-events';
import { neverSupply, Supply } from '@proc7ts/primitives';
import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';

/**
 * @internal
 */
class AttributesObserver {

  private readonly _emitters = new Map<string, EventEmitter<[string | null, string | null]>>();
  private _observer?: MutationObserver;

  constructor(private readonly _bs: BootstrapContext, readonly element: Element) {
  }

  private get observer(): MutationObserver {
    if (this._observer) {
      return this._observer;
    }

    const Observer = this._bs.get(BootstrapWindow).MutationObserver;

    return this._observer = new Observer(mutations => this._update(mutations));
  }

  observe(name: string, receiver: EventReceiver<[string | null, string | null]>): Supply {

    const self = this;
    const observer = this.observer;
    const emitter = this._emitter(name);
    const rcv = eventReceiver(receiver);
    const supply = emitter.on({
      supply: new Supply(() => {
        this._emitters.delete(name);
        observer.disconnect();
        if (this._emitters.size) {
          reconnect();
        } else {
          this._observer = undefined;
        }
      }).needs(rcv.supply),
      receive: (ctx, newValue, oldValue) => rcv.receive(ctx, newValue, oldValue),
    });

    observer.disconnect();
    reconnect();

    return supply;

    function reconnect(): void {
      self._update(observer.takeRecords());
      observer.observe(self.element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [...self._emitters.keys()],
      });
    }
  }

  private _update(mutations: MutationRecord[]): void {
    mutations.forEach(mutation => {

      const attributeName = mutation.attributeName as string;
      const emitter = this._emitters.get(attributeName);

      if (emitter) {
        emitter.send(this.element.getAttribute(attributeName) as string, mutation.oldValue);
      }
    });
  }

  private _emitter(name: string): EventEmitter<[string | null, string | null]> {

    const emitter = new EventEmitter<[string | null, string | null]>();

    this._emitters.set(name, emitter);

    return emitter;
  }

}

/**
 * @internal
 */
class AttributeTracker extends ValueTracker<string | null> {

  readonly on: OnEvent<[string | null, string | null]>;
  private readonly _updates = new EventEmitter<[string | null, string | null]>();

  constructor(
      private readonly _observer: AttributesObserver,
      private readonly _name: string,
  ) {
    super();

    let observeSupply = neverSupply();

    this.on = onEventBy(receiver => {
      if (!this._updates.size) {
        observeSupply = this._observer.observe(
            this._name,
            (newValue, oldValue) => this._updates.send(newValue, oldValue),
        );
      }
      receiver.supply.needs(observeSupply);
      this._updates.on(receiver).whenOff(reason => {
        if (!this._updates.size) {
          observeSupply.off(reason);
        }
      });
    });
  }

  get supply(): Supply {
    return this._updates.supply;
  }

  get it(): string | null {
    return this._observer.element.getAttribute(this._name);
  }

  set it(value: string | null) {
    if (value != null) {
      this._observer.element.setAttribute(this._name, value);
    } else {
      this._observer.element.removeAttribute(this._name);
    }
  }

}

/**
 * @internal
 */
export class NodeAttributes {

  private readonly _attrs = new Map<string, AttributeTracker>();
  private readonly _observer: AttributesObserver;

  constructor(bs: BootstrapContext, element: any) {
    this._observer = new AttributesObserver(bs, element);
  }

  get(name: string): ValueTracker<string | null> {

    const existing = this._attrs.get(name);

    if (existing) {
      return existing;
    }

    const created = new AttributeTracker(this._observer, name);

    this._attrs.set(name, created);

    return created;
  }

}
