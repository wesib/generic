import { ComponentContext } from '@wesib/wesib';
import { EventProducer, StatePath, StateTracker } from 'fun-events';
import { ValueTracker } from '../common';

/**
 * @internal
 */
export class PropertyTracker<T> extends ValueTracker<T> {

  readonly on: EventProducer<(this: void, newValue: T, oldValue: T) => void>;

  constructor(private readonly _context: ComponentContext<any>, private readonly _key: PropertyKey) {
    super();

    const tracker = _context.get(StateTracker).track(StatePath.ofProperty(_key));

    this.on = EventProducer.of(
        (consumer: (newValue: T, oldValue: T) => void) => tracker.onUpdate(
            (_path, newValue: any, oldValue: any) => consumer(newValue, oldValue)));
  }

  get it(): T {
    return this._context.element[this._key];
  }

  set it(value: T) {
    this._context.element[this._key] = value;
  }

}
