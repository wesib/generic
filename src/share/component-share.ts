import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ContextKey__symbol, ContextRegistry } from '@proc7ts/context-values';
import { ContextUpKey, ContextUpRef } from '@proc7ts/context-values/updatable';
import {
  afterAll,
  AfterEvent,
  afterEventBy,
  afterThe,
  deduplicateAfter,
  deduplicateAfter_,
  digAfter_,
  isAfterEvent,
  sendEventsTo,
  shareAfter,
  translateAfter_,
} from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { BootstrapContext, ComponentContext, ComponentElement, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareRef } from './component-share-ref';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { ComponentShare$, ComponentShare$impl } from './component-share.impl';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';
import { SharedByComponent$Registrar } from './shared-by-component.impl';

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
export class ComponentShare<T> implements ComponentShareRef<T>, ContextUpRef<AfterEvent<[T?]>, SharedByComponent<T>> {

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
   */
  get [ComponentShare__symbol](): this {
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
  get [ContextKey__symbol](): ContextUpKey<AfterEvent<[T?]>, SharedByComponent<T>> {
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
   * @param registrar - Shared value registrar.
   *
   * @return A builder of shared value for component context.
   */
  shareValue(
      registrar: SharedByComponent.Registrar<T>,
  ): void {
    this[ComponentShare$impl].shareValue(registrar);
  }

  /**
   * Creates a shared value registrar that shares a value created by the given provider.
   *
   * @typeParam TSharer - Sharer component type.
   * @param registry - Target component context registry.
   * @param provider - Shared value provider.
   *
   * @returns New shared value registrar.
   */
  createRegistrar<TSharer extends object>(
      registry: ContextRegistry<ComponentContext<TSharer>>,
      provider: SharedByComponent.Provider<T, TSharer>,
  ): SharedByComponent.Registrar<T> {
    return SharedByComponent$Registrar(registry, provider);
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
    const status = consumer.readStatus.do(
        deduplicateAfter_(
            (a, b) => a === b,
            ComponentShare$consumerStatus,
        ),
    );

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
   * - Prefers bare value.
   * - Prefers the value from {@link SharedByComponent.Detailed detailed specifier} with higher priority
   *   (i.e. lesser {@link SharedByComponent.Details.priority priority value}).
   * - Prefers the value declared last.
   *
   * @param values - The values shared by sharers. May contain a {@link SharedByComponent.Detailed detailed value
   * specifiers} in addition to pure values.
   *
   * @returns An `AfterEvent` keeper of selected value, if present.
   */
  selectValue(...values: SharedByComponent<T>[]): AfterEvent<[T?]> {

    let selected: SharedByComponent.Details<T> | undefined;

    for (let i = values.length - 1; i >= 0; --i) {

      const value = values[i];

      if (!SharedByComponent.hasDetails(value)) {
        return afterThe(value);
      }

      const details = value[SharedByComponent__symbol];

      if (!selected || selected.priority > details.priority) {
        selected = details;
      }
    }

    if (!selected) {
      return afterThe();
    }

    return afterEventBy<[T?]>(receiver => {

      const value = selected!.get();

      if (isAfterEvent(value)) {
        value(receiver);
      } else {
        sendEventsTo(receiver)(value);
      }
    }).do(
        shareAfter,
    );
  }

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
     * The order of aliases is important. It defines the {@link SharedByComponent.Details.priority priority} of the
     * value shared for the corresponding share.
     */
    readonly as?: ComponentShareRef<T> | readonly ComponentShareRef<T>[];

  }

  /**
   * A key of context value containing an `AfterEvent` keeper of shared value.
   *
   * @typeParam T - Shared value type.
   */
  export type Key<T> = ContextUpKey<AfterEvent<[T?]>, SharedByComponent<T>>;

  /**
   * A source value accepted by {@link ComponentShare component share}.
   *
   * An array of either source values, their {@link SharedByComponent.Detailed detailed descriptors} or an `AfterEvent`
   * keeper of the above.
   *
   * @typeParam T - Shared value type.
   */
  export type Source<T> = ContextUpKey.Source<SharedByComponent<T>>;

}

function ComponentShare$consumerStatus([{ settled, connected }]: [ComponentContext]): 0 | 1 | 2 {
  return connected ? 2 : settled ? 1 : 0;
}
