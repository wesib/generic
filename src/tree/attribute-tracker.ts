import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import {
  EventEmitter,
  EventInterest,
  EventReceiver,
  noEventInterest,
  OnEvent,
  onEventBy,
  ValueTracker,
} from 'fun-events';

class AttributesObserver {

  private readonly _emitters = new Map<string, EventEmitter<[string, string | null]>>();
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

  observe(name: string, receiver: EventReceiver<[string, string | null]>): EventInterest {

    const observer = this.observer;
    const emitter = this._emitter(name);
    const interest = emitter.on(receiver).whenDone(() => {
      this._emitters.delete(name);
      if (!this._emitters.size) {
        observer.disconnect();
        this._observer = undefined;
      }
    });

    observer.disconnect();
    this._update(observer.takeRecords());
    observer.observe(this.element, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [...this._emitters.keys()],
    });

    return interest;
  }

  private _update(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {

      const attributeName = mutation.attributeName as string;
      const emitter = this._emitters.get(attributeName);

      if (emitter) {
        emitter.send(this.element.getAttribute(attributeName) as string, mutation.oldValue);
      }
    });
  }

  private _emitter(name: string): EventEmitter<[string, string | null]> {

    const emitter = new EventEmitter();

    this._emitters.set(name, emitter);

    return emitter;
  }

}

class AttributeTracker extends ValueTracker<string | null, string> {

  private readonly _updates = new EventEmitter<[string, string | null]>();
  readonly on: OnEvent<[string, string | null]>;

  constructor(
      bs: BootstrapContext,
      private readonly _observer: AttributesObserver,
      private readonly _name: string) {
    super();

    let observeInterest = noEventInterest();

    this.on = onEventBy(receiver => {
      if (!this._updates.size) {
        observeInterest = this._observer.observe(
            _name,
            (newValue, oldValue) => this._updates.send(newValue, oldValue));
      }

      return this._updates.on(receiver).whenDone(reason => {
        if (!this._updates.size) {
          observeInterest.off(reason);
          observeInterest = noEventInterest();
        }
      }).needs(observeInterest);
    });
  }

  get it(): string | null {
    return this._observer.element.getAttribute(this._name);
  }

  set it(value: string | null) {
    this._observer.element.setAttribute(this._name, value as string);
  }

  done(reason?: any): this {
    this._updates.done(reason);
    return this;
  }

}

/**
 * @internal
 */
export class NodeAttributes {

  private readonly _attrs = new Map<string, AttributeTracker>();
  private readonly _observer: AttributesObserver;

  constructor(private readonly _bs: BootstrapContext, private readonly _element: any) {
    this._observer = new AttributesObserver(_bs, _element);
  }

  get(name: string): ValueTracker<string | null, string> {

    const existing = this._attrs.get(name);

    if (existing) {
      return existing;
    }

    const created = new AttributeTracker(this._bs, this._observer, name);

    this._attrs.set(name, created);

    return created;
  }

}
