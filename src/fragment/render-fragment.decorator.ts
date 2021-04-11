import { ComponentClass, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
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
  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(() => {

            const { component } = context;
            const renderer = get(component).bind(component);

            context.get(FragmentRenderCtl).renderFragmentBy(renderer, def);
          });
        });
      },
    },
  }));
}
