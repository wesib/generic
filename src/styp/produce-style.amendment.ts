import { StypRule, StypRules } from '@frontmeans/style-producer';
import {
  AeComponentMember,
  AeComponentMemberTarget,
  ComponentClass,
  ComponentMember,
  ComponentMemberAmendment,
} from '@wesib/wesib';
import { ComponentStypFormat, ComponentStypFormatConfig } from './component-styp-format';

/**
 * Creates an amendment (and decorator) of component member producing CSS rules to apply to component.
 *
 * An amended member should either contain a CSS rules source of type `StypRules.Source` or be a method returning it.
 *
 * Produces CSS using {@link ComponentStypFormat component style production format}.
 *
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended component member entity type.
 * @param config - Non-mandatory component style production format config.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<
    TClass extends ComponentClass,
    TAmended extends AeComponentMember<ProduceStyleDef.Source, TClass> =
        AeComponentMember<ProduceStyleDef.Source, TClass>>(
    config?: ComponentStypFormatConfig,
): ComponentMemberAmendment<ProduceStyleDef.Source, TClass, ProduceStyleDef.Source, TAmended> {
  return ComponentMember<ProduceStyleDef.Source, TClass, ProduceStyleDef.Source, TAmended>((
      { get, amend }: AeComponentMemberTarget<ProduceStyleDef.Source, TClass>,
  ) => amend({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(({ component }) => {

            const value = get(component);
            const source: StypRules.Source = typeof value === 'function' ? value.bind(component) : value;
            const format = context.get(ComponentStypFormat);

            format.produce(source, config);
          });
        });
      },
    },
  }));
}

export namespace ProduceStyleDef {

  /**
   * The source of produced style.
   *
   * Either a `StypRules.Source` or be a method returning it.
   *
   * A component member amended by {@link ProduceStyle @ProduceStyle} expected to have a value of this type.
   */
  export type Source =
      | StypRules.Source
      | (() => StypRule | StypRules | Promise<StypRule | StypRules>);

}
