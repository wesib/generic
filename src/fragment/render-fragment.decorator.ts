import { drekAppender, drekCharger } from '@frontmeans/drek';
import { valueByRecipe } from '@proc7ts/primitives';
import { ComponentClass, ComponentContext, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { FragmentRenderCtl } from './fragment-render-ctl';
import { FragmentRendererExecution } from './fragment-renderer';
import { RenderFragmentDef } from './render-fragment-def';

/**
 * Creates a {@link FragmentRenderer fragment renderer} method decorator.
 *
 * The decorated method accepts a {@link FragmentRendererExecution fragment rendering context} as its only parameter.
 *
 * @typeParam TClass - A type of decorated component class.
 * @param def - Non-mandatory rendering definition.
 *
 * @returns Component method decorator.
 */
export function RenderFragment<TClass extends ComponentClass>(
    def?: RenderFragmentDef,
): ComponentPropertyDecorator<(execution: FragmentRendererExecution) => void, TClass> {
  return ComponentProperty(({ key, get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
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
