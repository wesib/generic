import {
  AeClass,
  allAmender,
  Amendment,
  AmendRequest,
  AmendTarget,
  MemberAmendment,
  newAmendTarget,
} from '@proc7ts/amend';
import { AfterEvent, digAfter_ } from '@proc7ts/fun-events';
import { Class, valuesProvider } from '@proc7ts/primitives';
import {
  AeComponentMember,
  ComponentClass,
  ComponentInstance,
  ComponentMember,
  DefinitionContext,
  DefinitionSetup,
} from '@wesib/wesib';
import { Share } from './share';
import { ShareAccessor } from './share-accessor.impl';
import { Share__symbol } from './share-ref';
import { SharedValue$ContextBuilder } from './shared-value.impl';
import { targetShare, TargetShare } from './target-share';

/**
 * An amended entity representing a shared component member to amend.
 *
 * @typeParam T - Shared value type.
 * @typeParam TValue - Amended member value type.
 * @typeParam TClass - Amended component class type.
 */
export interface AeShared<
    T,
    TValue extends SharedDef.Value<T> = SharedDef.Value<T>,
    TClass extends ComponentClass = Class>
    extends AeComponentMember<TValue, TClass> {

  /**
   * Target share instance.
   */
  readonly share: Share<T>;

  /**
   * Whether the share is local.
   *
   * - `true` to make the value available only locally, i.e. only when requested by sharer context.
   * - `false` to make the value available to nested components too.
   */
  readonly localShare: boolean;

  /**
   * Reads value shared by target `component`.
   *
   * This method is not amendable.
   *
   * @param component - Sharer component instance.
   *
   * @returns An `AfterEvent` keeper of shared value.
   */
  getShared(this: void, component: InstanceType<TClass>): AfterEvent<[T?]>;

}

/**
 * An amendment of shared component member.
 *
 * Constructed by {@link Shared} function.
 *
 * @typeParam T - Shared value type.
 * @typeParam TValue - Amended member value type.
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended shared member entity type.
 */
export type SharedAmendment<
    T,
    TValue extends SharedDef.Value<T>,
    TClass extends ComponentClass = Class,
    TAmended extends AeShared<T, TValue, TClass> = AeShared<T, TValue, TClass>> =
    MemberAmendment.ForBase<AeClass<TClass>, AeShared<T, TValue, TClass>, TValue, TClass, TValue, TAmended>;

/**
 * Creates an amendment (and decorator) of component member that {@link Share shares} its value.
 *
 * The amended member should contain either a static value, or its `AfterEvent` keeper.
 *
 * Applies current component context to {@link Contextual} shared values.
 *
 * @typeParam T - Shared value type.
 * @typeParam TClass - A type of decorated component class.
 * @param share - Target component share.
 * @param amendments - Amendments to apply.
 *
 * @returns New shared member amendment.
 */
export function Shared<
    T,
    TValue extends SharedDef.Value<T> = SharedDef.Value<T>,
    TClass extends ComponentClass = Class,
    TAmended extends AeShared<T, TValue, TClass> = AeShared<T, TValue, TClass>>(
    share: TargetShare<T>,
    ...amendments: Amendment<TAmended>[]
): SharedAmendment<T, TValue, TClass, TAmended> {

  const { share: { [Share__symbol]: share$default }, local: localShare$default = false } = targetShare(share);

  return ComponentMember<TValue, TClass, TValue, TAmended>(baseTarget => {

    const accessorKey = Symbol(`${String(baseTarget.key)}:shared`);

    type Component = ComponentInstance<InstanceType<TClass>> & {
      [accessorKey]?: ShareAccessor<T, TValue, TClass>;
    };

    let lastTarget: AeComponentMember<TValue, TClass> = baseTarget;
    const accessorOf = (component: Component): ShareAccessor<T, TValue, TClass> => component[accessorKey]
        || (component[accessorKey] = new ShareAccessor(lastTarget, component));
    const getShared = (component: InstanceType<TClass>): AfterEvent<[T?]> => accessorOf(component).val.read;

    const lastAmender = (target: AmendTarget<AeShared<T, TValue, TClass>>): void => {
      lastTarget = target;
      target.amend({
        get: component => accessorOf(component).get(),
        set: target.writable
            ? (component, value) => accessorOf(component).set(value)
            : undefined,
        componentDef: {
          setup(setup: DefinitionSetup<InstanceType<TClass>>): void {
            setup.perComponent(SharedValue$ContextBuilder(
                target.share,
                {
                  provide: context => context.onceReady.do(
                      digAfter_(
                          ({ component }) => accessorOf(component).val,
                          valuesProvider<[T?]>(),
                      ),
                  ),
                },
            ));
          },
          define(defContext: DefinitionContext<InstanceType<TClass>>) {
            target.share.addSharer(defContext, { local: target.localShare });
          },
        },
      });
    };

    allAmender([...amendments, lastAmender])(newAmendTarget({
      base: {
        ...baseTarget as TAmended,
        share: share$default,
        localShare: localShare$default,
        getShared,
      },
      amend<TBase extends TAmended, TExt>(
          base: TBase,
          request = {} as AmendRequest<TBase, TExt>,
      ): () => AmendTarget.Draft<TBase & TExt> {

        const {
          share = base.share,
          localShare = base.localShare,
          getShared: $getShared,
          ...baseRequest
        } = request;

        const createBaseTarget = baseTarget.amend(baseRequest as AmendRequest<any>);

        return () => ({
          ...createBaseTarget(),
          share,
          localShare,
          getShared,
        } as AmendTarget.Draft<TBase & TExt>);
      },
    }));
  }) as SharedAmendment<T, TValue, TClass, TAmended>;
}

export namespace SharedDef {

  /**
   * Shared member value type.
   *
   * Either shared value, or its `AfterEvent` keeper.
   *
   * @typeParam T - Shared value type.
   */
  export type Value<T> = T | AfterEvent<[T?]>;

}
