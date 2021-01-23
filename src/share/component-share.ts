import { ContextKey__symbol } from '@proc7ts/context-values';
import { ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import {
  afterAll,
  AfterEvent,
  AfterEvent__symbol,
  afterEventBy,
  afterThe,
  digAfter_,
  EventKeeper,
  isEventKeeper,
  sendEventsTo,
  shareAfter,
  trackValue,
  translateAfter,
} from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import {
  BootstrapContext,
  ComponentContext,
  ComponentElement,
  ComponentSlot,
  DefinitionContext,
  DefinitionSetup,
} from '@wesib/wesib';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { ComponentShare$, ComponentShare$impl } from './component-share.impl';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';

export class ComponentShare<T> implements ContextUpRef<AfterEvent<[T?]>, SharedByComponent<T>> {

  /**
   * @internal
   */
  readonly [ComponentShare$impl]: ComponentShare$<T>;

  constructor(name: string, options: ComponentShare.Options<T> = {}) {
    this[ComponentShare$impl] = new ComponentShare$(this, name, options);
  }

  get name(): string {
    return this[ComponentShare$impl].name;
  }

  get [ContextKey__symbol](): ContextUpKey<AfterEvent<[T?]>, SharedByComponent<T>> {
    return this[ComponentShare$impl].key;
  }

  for(consumer: ComponentContext): AfterEvent<[T?]> {

    const sharers = consumer.get(BootstrapContext).get(ComponentShareRegistry).sharers(this);
    const status = trackValue<boolean>();
    const updateStatus = ({ connected }: ComponentContext): void => {
      status.it = connected;
    };

    consumer.whenSettled(updateStatus);
    consumer.whenConnected(updateStatus);
    status.supply.needs(consumer);

    let lastValue: T | null | undefined = null;

    return afterAll({
      sharers,
      status,
    }).do(
        digAfter_(({ sharers: [names] }): AfterEvent<[T?]> | undefined => {

          let element: ComponentElement = consumer.element;

          for (;;) {

            const parent = element.parentNode as ComponentElement | null
                || (element.getRootNode() as ShadowRoot).host as ComponentElement | undefined; // Inside shadow DOM?

            if (!parent) {
              return;
            }
            if (names.has(parent.tagName.toLowerCase())) {
              return ComponentSlot.of(element).read.do(
                  digAfter_(sharerContext => sharerContext && sharerContext.get(this)),
              );
            }

            element = parent;
          }
        }),
        translateAfter((send, value) => {
          if (lastValue !== value) {
            lastValue = value;
            send(value);
          }
        }),
    );
  }

  shareBy(defContext: DefinitionContext): Supply {
    return this[ComponentShare$impl].shareBy(defContext);
  }

  provideValue<TComponent extends object>(
      setup: DefinitionSetup<TComponent>,
      provider: (this: void, context: ComponentContext<TComponent>) => T | EventKeeper<[] | [T]>,
  ): void {
    this[ComponentShare$impl].provideValue(setup, provider);
  }

  selectValue(...values: SharedByComponent<T>[]): AfterEvent<[] | [T]> {

    let selected: SharedByComponent.Details<T> | undefined;

    for (const value of values) {
      if (!SharedByComponent.isDetailed(value)) {
        return afterThe(value);
      }

      const details = value[SharedByComponent__symbol];

      if (!selected || selected.order > details.order) {
        selected = details;
      }
    }

    if (!selected) {
      return afterThe();
    }

    return afterEventBy<[] | [T]>(receiver => {

      const value = selected!.get();

      if (isEventKeeper(value)) {
        value[AfterEvent__symbol]()(receiver);
      } else {
        sendEventsTo(receiver)(value);
      }
    }).do(
        shareAfter,
    );
  }

}

export namespace ComponentShare {

  export interface Options<T> {

    readonly aliases?: ComponentShare<T> | readonly ComponentShare<T>[];

  }

}
