import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventEmitter, eventInterest, EventInterest, EventReceiver } from 'fun-events';

const KEY = /*#__PURE__*/ new SingleContextKey<AttributesObserver>('attributes-observer');

type ObserveAttribute = (name: string, receiver: EventReceiver<[string, string | null]>) => EventInterest;

/**
 * @internal
 */
export class AttributesObserver {

  static get key(): ContextKey<AttributesObserver> {
    return KEY;
  }

  private readonly _elements = new Map<Element, ObserveAttribute>();

  constructor(private readonly _context: BootstrapContext) {
  }

  observe(
      element: Element,
      name: string,
      receiver: EventReceiver<[string, string | null]>): EventInterest {
    return this._element(element)(name, receiver);
  }

  private _element(element: Element): ObserveAttribute {

    const self = this;
    const found = this._elements.get(element);

    if (found) {
      return found;
    }

    const attributes = new Map<string, EventEmitter<[string, string | null]>>();
    const Observer: typeof MutationObserver = (this._context.get(BootstrapWindow) as any).MutationObserver;
    const observer = new Observer(mutations => _update(mutations));

    this._elements.set(element, _observeAttribute);

    return _observeAttribute;

    function _observeAttribute(name: string, receiver: EventReceiver<[string, string | null]>) {

      const emitter = _attributeEmitter(name);
      const interest = emitter.on(receiver);

      observer.disconnect();
      _update(observer.takeRecords());
      observer.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [...attributes.keys()],
      });

      return eventInterest(() => {
        interest.off();
        if (!emitter.size) {
          attributes.delete(name);
          if (!attributes.size) {
            observer.disconnect();
            self._elements.delete(element);
          }
        }
      }).needs(interest);
    }

    function _attributeEmitter(name: string): EventEmitter<[string, string | null]> {

      const emitter = new EventEmitter();

      attributes.set(name, emitter);

      return emitter;
    }

    function _update(mutations: MutationRecord[]) {
      mutations.forEach(mutation => {

        const attributeName = mutation.attributeName as string;
        const emitter = attributes.get(attributeName);

        if (!emitter) {
          return;
        }

        emitter.send(element.getAttribute(attributeName) as string, mutation.oldValue);
      });
    }
  }

}
