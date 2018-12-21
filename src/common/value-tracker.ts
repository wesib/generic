import { EventProducer } from 'fun-events';

/**
 * Value accessor and changes tracker.
 */
export abstract class ValueTracker<T = any, N extends T = T> {

  /**
   * Value changes event producer.
   *
   * The registered event consumers receive new and old values as arguments.
   */
  abstract readonly on: EventProducer<(this: void, newValue: N, oldValue: T) => void>;

  /**
   * Reads the tracked value.
   *
   * @returns The value.
   */
  abstract get it(): T;

  /**
   * Updates the tracked value.
   *
   * @param value New value.
   */
  abstract set it(value: T);

}
