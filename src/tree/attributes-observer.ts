import { BootstrapWindow, ComponentContext } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventEmitter, EventInterest } from 'fun-events';

/**
 * @internal
 */
export class AttributesObserver {

  static key: ContextKey<AttributesObserver> = new SingleContextKey('attributes-observer');

  private readonly _observer: MutationObserver;
  private readonly _attributes = new Map<string, EventEmitter<(oldValue: string, newValue: string | null) => void>>();

  constructor(private readonly _context: ComponentContext) {

    const Observer: typeof MutationObserver = (_context.get(BootstrapWindow) as any).MutationObserver;

    this._observer = new Observer(mutations => this._update(mutations));
  }

  observe(name: string, consumer: (oldValue: string, newValue: string | null) => void): EventInterest {

    const [emitter, newAttribute] = this._emitter(name);
    const interest = emitter.on(consumer);

    if (newAttribute) {
      this._observer.disconnect();
      this._update(this._observer.takeRecords());
      this._observer.observe(this._context.element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [...this._attributes.keys()],
      });
    }

    return {
      off: () => {
        interest.off();
        if (!emitter.consumers) {
          this._attributes.delete(name);
          if (!this._attributes.size) {
            this._observer.disconnect();
          }
        }
      }
    };
  }

  private _emitter(name: string): [EventEmitter<(oldValue: string, newValue: string | null) => void>, boolean] {

    let emitter = this._attributes.get(name);

    if (emitter) {
      return [emitter, false];
    }

    emitter = new EventEmitter();
    this._attributes.set(name, emitter);

    return [emitter, true];
  }

  private _update(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {

      const attributeName = mutation.attributeName as string;
      const emitter = this._attributes.get(attributeName);

      if (!emitter) {
        return;
      }

      emitter.notify(this._context.element.getAttribute(attributeName), mutation.oldValue);
    });
  }

}
