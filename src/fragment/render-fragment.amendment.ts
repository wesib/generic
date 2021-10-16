import { drekAppender, drekCharger } from '@frontmeans/drek';
import { valueByRecipe } from '@proc7ts/primitives';
import {
  AeComponentMember,
  AeComponentMemberTarget,
  ComponentClass,
  ComponentContext,
  ComponentMember,
  ComponentMemberAmendment,
} from '@wesib/wesib';
import { FragmentRenderCtl } from './fragment-render-ctl';
import { RenderFragmentDef } from './render-fragment-def';

/**
 * Creates a {@link RenderFragmentDef.Method fragment renderer method} amendment (amd decorator).
 *
 * @typeParam TClass - Amended component class type.
 * @typeParam TAmended - Amended component member entity type.
 * @param def - Non-mandatory rendering definition.
 *
 * @returns New component method amendment.
 */
export function RenderFragment<
    TClass extends ComponentClass,
    TAmended extends AeComponentMember<RenderFragmentDef.Method, TClass>>(
    def?: RenderFragmentDef,
): ComponentMemberAmendment<RenderFragmentDef.Method, TClass, RenderFragmentDef.Method, TAmended> {
  return ComponentMember<RenderFragmentDef.Method, TClass, RenderFragmentDef.Method, TAmended>((
      { key, get, amend }: AeComponentMemberTarget<RenderFragmentDef.Method, TClass>,
  ) => amend({
    componentDef: {
      define(defContext) {
        defContext.whenComponent((context: ComponentContext<InstanceType<TClass>>) => {
          context.whenReady(() => {

            const { component } = context;
            const renderer = get(component).bind(component);

            context.get(FragmentRenderCtl).renderFragmentBy(
                renderer,
                RenderFragment$def(context, key, def),
            );
          });
        });
      },
    },
  }));
}

function RenderFragment$def(
    context: ComponentContext,
    key: PropertyKey,
    def: RenderFragmentDef = {},
): RenderFragmentDef {

  const spec = valueByRecipe(def, context);
  const { target = ({ contentRoot }) => drekCharger(drekAppender(contentRoot), RenderFragment$defaultRem(key)) } = spec;

  return { ...spec, target };
}

function RenderFragment$defaultRem(key: PropertyKey): string {

  const rem = String(key);

  return rem.startsWith('render') ? rem.substr(6) : rem;
}
