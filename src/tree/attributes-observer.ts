import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventEmitter, eventInterest, EventInterest } from 'fun-events';

const KEY = /*#__PURE__*/ new SingleContextKey<AttributesObserver>('attributes-observer');

/**
 * @internal
 */
export class AttributesObserver {

  static get key(): ContextKey<AttributesObserver> {
    return KEY;
  }

  private readonly _attributes = new Map<string, EventEmitter<[string, string | null]>>();

  constructor(private readonly _context: BootstrapContext) {
  }

  observe(
      element: Element,
      name: string,
      receiver: (oldValue: string, newValue: string | null) => void): EventInterest {

    const Observer: typeof MutationObserver = (this._context.get(BootstrapWindow) as any).MutationObserver;
    const observer = new Observer(mutations => this._update(element, mutations));

    const [emitter, newAttribute] = this._emitter(name);
    const interest = emitter.on(receiver);

    if (newAttribute) {
      observer.disconnect();
      this._update(element, observer.takeRecords());
      observer.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [...this._attributes.keys()],
      });
    }

    return eventInterest(() => {
      interest.off();
      if (!emitter.size) {
        this._attributes.delete(name);
        if (!this._attributes.size) {
          observer.disconnect();
        }
      }
    }).needs(interest);
  }

  private _emitter(name: string): [EventEmitter<[string, string | null]>, boolean] {

    let emitter = this._attributes.get(name);

    if (emitter) {
      return [emitter, false];
    }

    emitter = new EventEmitter();
    this._attributes.set(name, emitter);

    return [emitter, true];
  }

  private _update(element: Element, mutations: MutationRecord[]) {
    mutations.forEach(mutation => {

      const attributeName = mutation.attributeName as string;
      const emitter = this._attributes.get(attributeName);

      if (!emitter) {
        return;
      }

      emitter.send(element.getAttribute(attributeName) as string, mutation.oldValue);
    });
  }

}
