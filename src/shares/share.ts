import { nodeHost } from '@frontmeans/dom-primitives';
import { CxEntry } from '@proc7ts/context-values';
import {
  afterAll,
  AfterEvent,
  afterEventBy,
  afterThe,
  deduplicateAfter,
  deduplicateAfter_,
  digAfter_,
  mapAfter_,
  sendEventsTo,
  supplyAfter,
  translateAfter_,
} from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { BootstrapContext, ComponentContext, ComponentElement, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { ShareLocator } from './share-locator';
import { ShareRef } from './share-ref';
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
export class Share<T> implements ShareRef<T>, CxEntry<AfterEvent<[T?]>, SharedValue<T>> {

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
  get share(): this {
    return this;
  }

  /**
   * A human-readable name of the name.
   */
  get name(): string {
    return this[Share$impl__symbol].name;
  }

  get [Symbol.toStringTag](): string {
    return this.name;
  }

  perContext(target: Share.Target<T>): Share.Definition<T> {

    const track: () => AfterEvent<[T?]> = target.lazy(target => Share$track(this, target));

    return {
      assign(receiver) {
        receiver(track());
      },
    };
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
   * @param target - Shared value definition target.
   * @param provider - Shared value provider.
   *
   * @returns New shared value registrar.
   */
  createRegistrar<TSharer extends object>(
      target: CxEntry.Target<
          AfterEvent<[T?]>,
          SharedValue<T> | AfterEvent<SharedValue<T>[]>,
          ComponentContext<TSharer>>,
      provider: SharedValue.Provider<T, TSharer>,
  ): SharedValue.Registrar<T> {
    return SharedValue$Registrar(target, provider);
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

    const { host = nodeHost, local } = options;
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

          let element: ComponentElement | undefined = host(consumer.element);

          while (element) {
            if (sharers.names.has(element.tagName.toLowerCase())) {
              return ComponentSlot.of(element).read.do(
                  digAfter_(sharer => sharer ? Share$sharedValue(this, sharer) : afterThe()),
              );
            }

            element = host(element);
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
   * @returns Either selected value, or `undefined` when not present.
   */
  selectValue(...values: SharedValue<T>[]): T | undefined {

    let selected: SharedValue.Details<T> | undefined;

    for (let i = values.length - 1; i >= 0; --i) {

      const value = values[i];

      if (!SharedValue.hasDetails(value)) {
        return value;
      }

      const details = value[SharedValue__symbol];

      if (!selected || selected.priority > details.priority) {
        selected = details;
      }
    }

    return selected && selected.value;
  }

  toString(): string {
    return `[Share ${this[Symbol.toStringTag]}]`;
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
    readonly as?: ShareRef<T> | readonly ShareRef<T>[] | undefined;

  }

  /**
   * Shared value definition target.
   *
   * @typeParam T - Shared value type.
   * @typeParam TSharer - Sharer component type.
   */
  export type Target<T, TSharer extends object = any> =
      CxEntry.Target<AfterEvent<[T?]>, SharedValue<T>, ComponentContext<TSharer>>;

  /**
   * Shared value definition.
   *
   * @typeParam T - Shared value type.
   */
  export type Definition<T> = CxEntry.Definition<AfterEvent<[T?]>>;

}

function Share$track<T>(share: Share<T>, target: Share.Target<T>): AfterEvent<[T?]> {

  const shared = afterEventBy<SharedValue<T>[]>(receiver => {

    const dispatch = sendEventsTo(receiver);

    target.trackAssetList(assetList => dispatch(...assetList.flatMap(provided => {

      const assets: SharedValue<T>[] = [];

      provided.eachAsset((asset: SharedValue<T>) => {
        assets.push(asset);
      });

      return assets;
    })));
  });

  return shared.do(
      mapAfter_((...values: SharedValue<T>[]) => share.selectValue(...values)),
      supplyAfter(target.supply),
  );
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
