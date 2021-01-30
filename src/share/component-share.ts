import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ContextBuilder, ContextBuilder__symbol, ContextKey__symbol } from '@proc7ts/context-values';
import { ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import {
  afterAll,
  AfterEvent,
  AfterEvent__symbol,
  afterEventBy,
  afterThe,
  deduplicateAfter,
  digAfter_,
  EventKeeper,
  isEventKeeper,
  sendEventsTo,
  shareAfter,
  trackValue,
  translateAfter_,
} from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { BootstrapContext, ComponentContext, ComponentElement, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { ComponentShare$, ComponentShare$impl } from './component-share.impl';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';

/**
 * A key of {@link ComponentShareRef component share reference} method returning referred {@link ComponentShare
 * component share} instance.
 */
export const ComponentShare__symbol = (/*#__PURE__*/ Symbol('ComponentShare'));

/**
 * A kind of the value a component shares with the nested ones.
 *
 * The sharing implies the following:
 *
 * - The sharer component {@link addSharer registers} its element name as the one bound to sharer.
 * - The sharer component {@link shareValue provides} an (updatable) shared value within its context.
 * - The consumer component {@link valueFor obtains} the shared value by searching the parent element with a sharer
 *   bound to it.
 *
 * A share instance is used as an identifier in all these steps.
 *
 * A {@link Shared @Shared} component property decorator may be used to automate this.
 *
 * @typeParam T - Shared value type.
 */
export class ComponentShare<T>
    implements ComponentShareRef<T>, ContextUpRef<AfterEvent<[T] | []>, SharedByComponent<T>> {

  /**
   * @internal
   */
  readonly [ComponentShare$impl]: ComponentShare$<T>;

  /**
   * Constructs new component share.
   *
   * @param name - A human-readable name of the share.
   * @param options - Constructed share options.
   */
  constructor(name: string, options: ComponentShare.Options<T> = {}) {
    this[ComponentShare$impl] = new ComponentShare$(this, name, options);
  }

  /**
   * Refers to itself.
   *
   * @returns `this` component share instance.
   */
  [ComponentShare__symbol](): this {
    return this;
  }

  /**
   * A human-readable name of the name.
   */
  get name(): string {
    return this[ComponentShare$impl].name;
  }

  /**
   * A key of the sharer component context value containing an `AfterEvent` keeper of the shared value.
   */
  get [ContextKey__symbol](): ContextUpKey<AfterEvent<[T] | []>, SharedByComponent<T>> {
    return this[ComponentShare$impl].key;
  }

  /**
   * Registers a sharer component.
   *
   * The registration is necessary for consumers to be able to find the element bound to sharer by that element's name.
   *
   * @param defContext - The definition context of the sharer component.
   * @param name - The name of the element the sharer component is bound to. Defaults to component's element name.
   *
   * @returns Sharer registration supply. Revokes the sharer registration once cut off.
   */
  addSharer(defContext: DefinitionContext, name?: QualifiedName): Supply {
    return this[ComponentShare$impl].addSharer(defContext, name);
  }

  /**
   * Shares a value by providing it for the sharer component context.
   *
   * @typeParam - A type of the sharer component.
   * @param provider - Shared value provider. This is a function accepting a sharer component context as its only
   * parameter, and returning either a static value, or an event keeper reporting it.
   */
  shareValue<TComponent extends object>(
      provider: (this: void, context: ComponentContext<TComponent>) => T | EventKeeper<[T] | []>,
  ): ContextBuilder<ComponentContext<TComponent>> {
    return {
      [ContextBuilder__symbol]: registry => this[ComponentShare$impl].shareValue(registry, provider),
    };
  }

  /**
   * Obtains a shared value for the consuming component.
   *
   * Searches among parent elements for the one bound to the sharer component, then obtains the shared value from
   * the sharer's context.
   *
   * @param consumer - Consumer component context.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
  valueFor(consumer: ComponentContext): AfterEvent<[T, ComponentContext] | []> {

    const sharers = consumer.get(BootstrapContext).get(ComponentShareRegistry).sharers(this);
    const status = trackValue<boolean>();
    const updateStatus = ({ connected }: ComponentContext): void => {
      status.it = connected;
    };

    consumer.whenSettled(updateStatus);
    consumer.whenConnected(updateStatus);
    status.supply.needs(consumer);

    return afterAll({
      sharers,
      status,
    }).do(
        digAfter_(({ sharers: [names] }): AfterEvent<[T, ComponentContext] | []> => {

          let element: ComponentElement = consumer.element;

          for (;;) {

            const parent = element.parentNode as ComponentElement | null
                || (element.getRootNode() as ShadowRoot).host as ComponentElement | undefined; // Inside shadow DOM?

            if (!parent) {
              return afterThe();
            }

            if (names.has(parent.tagName.toLowerCase())) {
              return ComponentSlot.of(parent).read.do(
                  digAfter_(sharerContext => sharerContext
                      ? sharerContext.get(this).do(
                          translateAfter_((send, value?) => value ? send(value, sharerContext) : send()),
                      )
                      : afterThe()),
              );
            }

            element = parent;
          }
        }),
        deduplicateAfter(),
    );
  }

  /**
   * Selects a shared value among candidates.
   *
   * It is especially useful when the value shared by multiple sharers.
   *
   * By default:
   *
   * - Prefers pure value.
   * - Prefers the value detailed value specifier with lesser {@link SharedByComponent.Details.order order}.
   * - Prefers the value declared last.
   *
   * @param values - The values shared by sharers. May contain a {@link SharedByComponent.Detailed detailed value
   * specifiers} in addition to pure values.
   *
   * @returns An `AfterEvent` keeper of selected value, if present.
   */
  selectValue(...values: SharedByComponent<T>[]): AfterEvent<[T] | []> {

    let selected: SharedByComponent.Details<T> | undefined;

    for (let i = values.length - 1; i >= 0; --i) {

      const value = values[i];

      if (!SharedByComponent.hasDetails(value)) {
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

    return afterEventBy<[T] | []>(receiver => {

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

/**
 * A reference to {@link ComponentShare component share}.
 *
 * @typeParam T - Shared value type.
 */
export interface ComponentShareRef<T> {

  /**
   * Refers to component share.
   *
   * @returns Referred component share instance.
   */
  [ComponentShare__symbol](): ComponentShare<T>;

}

export namespace ComponentShare {

  /**
   * {@link ComponentShare Component share} options.
   *
   * @typeParam T - Shared value type.
   */
  export interface Options<T> {

    /**
     * Component share reference(s) the share provides a value for in addition to the one it provides for itself.
     *
     * The order of aliases is important. It defines the {@link SharedByComponent.Details.order order} of the value
     * shared for the corresponding share.
     */
    readonly aliases?: ComponentShareRef<T> | readonly ComponentShareRef<T>[];

  }

}
