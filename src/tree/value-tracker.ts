import { EventProducer } from 'fun-events';

/**
 * Value accessor and changes tracker.
 */
export abstract class ValueTracker<T = any, O = T> {

  /**
   * Value changes event producer.
   *
   * The registered event consumers receive new and old values as arguments.
   */
  abstract readonly on: EventProducer<(this: void, newValue: T, oldValue: O) => void>;

  /**
   * Reads the tracked value.
   *
   * @returns The value.
   */
  abstract get it(): O;

  /**
   * Updates the tracked value.
   *
   * @param value New value.
   */
  abstract set it(value: O);

}
