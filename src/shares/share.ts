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
import {
  BootstrapContext,
  ComponentContext,
  ComponentElement,
  ComponentSlot,
  DefinitionContext,
  parentElement,
} from '@wesib/wesib';
import { ShareLocator } from './share-locator';
import { Share__symbol, ShareRef } from './share-ref';
import { ShareRegistry } from './share-registry.impl';
import { Share$, Share$impl__symbol } from './share.impl';
import { SharedValue, SharedValue__symbol } from './shared-value';
import { SharedValue$Registrar } from './shared-value.impl';

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
export class Share<T> implements ShareRef<T>, ContextUpRef<AfterEvent<[T?]>, SharedValue<T>> {

  /**
   * @internal
   */
  readonly [Share$impl__symbol]: Share$<T>;

  /**
   * Constructs new component share.
   *
   * @param name - A human-readable name of the share.
   * @param options - Constructed share options.
   */
  constructor(name: string, options: Share.Options<T> = {}) {
    this[Share$impl__symbol] = new Share$(this, name, options);
  }

  /**
   * Refers to itself.
   */
  get [Share__symbol](): this {
    return this;
  }

  /**
   * A human-readable name of the name.
   */
  get name(): string {
    return this[Share$impl__symbol].name;
  }

  /**
   * A key of the sharer component context value containing an `AfterEvent` keeper of the shared value.
   */
  get [ContextKey__symbol](): ContextUpKey<AfterEvent<[T?]>, SharedValue<T>> {
    return this[Share$impl__symbol].key;
  }

  /**
   * Registers a sharer component.
   *
   * The registration is necessary for consumers to be able to find the element bound to sharer by that element's name.
   *
   * @param defContext - The definition context of the sharer component.
   * @param options - Value sharing options.
   *
   * @returns Sharer registration supply. Revokes the sharer registration once cut off.
   */
  addSharer(defContext: DefinitionContext, options?: SharedValue.Options): Supply {
    return this[Share$impl__symbol].addSharer(defContext, options);
  }

  /**
   * Shares a value by providing it for the sharer component context.
   *
   * @param registrar - Shared value registrar.
   *
   * @return A builder of shared value for component context.
   */
  shareValue(
      registrar: SharedValue.Registrar<T>,
  ): void {
    this[Share$impl__symbol].shareValue(registrar);
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
      provider: SharedValue.Provider<T, TSharer>,
  ): SharedValue.Registrar<T> {
    return SharedValue$Registrar(registry, provider);
  }

  /**
   * Locates a shared value for the consuming component.
   *
   * Searches among parent elements for the one bound to the sharer component, then obtains the shared value from
   * the sharer's context.
   *
   * @param consumer - Consumer component context.
   * @param options - Location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
  valueFor(
      consumer: ComponentContext,
      options: ShareLocator.Options = {},
  ): AfterEvent<[T, ComponentContext] | []> {

    const { local } = options;
    const sharers = consumer.get(BootstrapContext).get(ShareRegistry).sharers(this);
    const status = consumer.readStatus.do(
        deduplicateAfter_(
            (a, b) => a === b,
            Share$consumerStatus,
        ),
    );

    return afterAll({
      sharers,
      status,
    }).do(
        digAfter_(({ sharers: [sharers] }): AfterEvent<[T, ComponentContext] | []> => {
          if (local) {
            if (sharers.sharers.has(consumer.componentType)) {
              return Share$sharedValue(this, consumer);
            }
            if (local === true) {
              return afterThe();
            }
          }

          let element: ComponentElement | null = parentElement(consumer.element);

          while (element) {
            if (sharers.names.has(element.tagName.toLowerCase())) {
              return ComponentSlot.of(element).read.do(
                  digAfter_(sharer => sharer ? Share$sharedValue(this, sharer) : afterThe()),
              );
            }

            element = parentElement(element);
          }

          return afterThe();
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
   * - Prefers the value from {@link SharedValue.Detailed detailed specifier} with higher priority
   *   (i.e. lesser {@link SharedValue.Details.priority priority value}).
   * - Prefers the value declared last.
   *
   * @param values - The values shared by sharers. May contain a {@link SharedValue.Detailed detailed value
   * specifiers} in addition to pure values.
   *
   * @returns An `AfterEvent` keeper of selected value, if present.
   */
  selectValue(...values: SharedValue<T>[]): AfterEvent<[T?]> {

    let selected: SharedValue.Details<T> | undefined;

    for (let i = values.length - 1; i >= 0; --i) {

      const value = values[i];

      if (!SharedValue.hasDetails(value)) {
        return afterThe(value);
      }

      const details = value[SharedValue__symbol];

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

export namespace Share {

  /**
   * {@link Share Component share} options.
   *
   * @typeParam T - Shared value type.
   */
  export interface Options<T> {

    /**
     * Component share reference(s) the share provides a value for in addition to the one it provides for itself.
     *
     * The order of aliases is important. It defines the {@link SharedValue.Details.priority priority} of the
     * value shared for the corresponding share.
     */
    readonly as?: ShareRef<T> | readonly ShareRef<T>[];

  }

  /**
   * A key of context value containing an `AfterEvent` keeper of shared value.
   *
   * @typeParam T - Shared value type.
   */
  export type Key<T> = ContextUpKey<AfterEvent<[T?]>, SharedValue<T>>;

  /**
   * A source value accepted by {@link Share component share} context value.
   *
   * Either a single shared value, its {@link SharedValue.Detailed detailed descriptor}, or an `AfterEvent`
   * keeper of the above.
   *
   * @typeParam T - Shared value type.
   */
  export type Source<T> = ContextUpKey.Source<SharedValue<T>>;

}

function Share$consumerStatus([{ settled, connected }]: [ComponentContext]): 0 | 1 | 2 {
  return connected ? 2 : settled ? 1 : 0;
}

function Share$sharedValue<T>(
    share: Share<T>,
    sharer: ComponentContext,
): AfterEvent<[T, ComponentContext] | []> {
  return sharer.get(share).do(
      translateAfter_((send, value?) => value ? send(value, sharer) : send()),
  );
}
