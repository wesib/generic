import {
  EventEmitter,
  eventReceiver,
  EventReceiver,
  eventSupply,
  EventSupply,
  EventSupply__symbol,
  eventSupplyOf,
  noEventSupply,
  OnEvent,
  onEventBy,
  ValueTracker,
} from '@proc7ts/fun-events';
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

    const Observer: typeof MutationObserver = (this._bs.get(BootstrapWindow) as any).MutationObserver;

    return this._observer = new Observer(mutations => this._update(mutations));
  }

  observe(name: string, receiver: EventReceiver<[string | null, string | null]>): EventSupply {

    const self = this;
    const observer = this.observer;
    const emitter = this._emitter(name);
    const rcv = eventReceiver(receiver);
    const supply = emitter.on({
      supply: eventSupply(() => {
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
        attributeFilter: Array.from(self._emitters.keys()),
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

  private readonly _updates = new EventEmitter<[string | null, string | null]>();

  constructor(
      private readonly _observer: AttributesObserver,
      private readonly _name: string,
  ) {
    super();
  }

  get [EventSupply__symbol](): EventSupply {
    return eventSupplyOf(this._updates);
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

  on(): OnEvent<[string | null, string | null]>;
  on(receiver: EventReceiver<[string | null, string | null]>): EventSupply;
  on(receiver?: EventReceiver<[string | null, string | null]>): OnEvent<[string | null, string | null]> | EventSupply {

    let observeSupply = noEventSupply();

    return (this.on = onEventBy(receiver => {
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
    }).F)(receiver);
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
