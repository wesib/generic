import { ComponentContext } from '@wesib/wesib';
import { EventProducer } from 'fun-events';
import { AttributesObserver } from './attributes-observer';
import { ValueTracker } from '../common';

/**
 * @internal
 */
export class AttributeTracker extends ValueTracker<string | null | string> {

  readonly on: EventProducer<(this: void, newValue: string, oldValue: string | null) => void>;

  constructor(private readonly _context: ComponentContext<any>, private readonly _name: string) {
    super();

    const observer = _context.get(AttributesObserver);

    this.on = EventProducer.of(consumer => observer.observe(_name, consumer));
  }

  get it(): string | null {
    return this._context.element.getAttribute(this._name);
  }

  set it(value: string | null) {
    this._context.element.setAttribute(this._name, value);
  }

}
