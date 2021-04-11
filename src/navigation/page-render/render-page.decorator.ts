import { Class } from '@proc7ts/primitives';
import { ComponentClass, ComponentProperty, ComponentPropertyDecorator } from '@wesib/wesib';
import { PageLoadSupport } from '../page-load';
import { PageRenderCtl } from './page-render-ctl';
import { PageRendererExecution } from './page-renderer';
import { RenderPageDef } from './render-page-def';

/**
 * Creates a {@link PageRenderer page renderer} method decorator.
 *
 * The decorated method accepts a {@link PageRendererExecution page rendering context} as its only parameter.
 *
 * Renders the page using {@link PageRenderCtl page render control}.
 *
 * Utilizes {@link PageLoadParam} navigation parameter.
 *
 * Enables {@link PageLoadSupport} feature.
 *
 * @typeParam T - A type of decorated component class.
 * @param def - Page inclusion definition.
 *
 * @returns New component decorator.
 */
export function RenderPage<TClass extends ComponentClass = Class>(
    def?: RenderPageDef,
): ComponentPropertyDecorator<(execution: PageRendererExecution) => void, TClass> {
  return ComponentProperty(({ get }) => ({
    componentDef: {
      feature: {
        needs: [PageLoadSupport],
      },
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(context => {

            const { component } = context;
            const renderer = get(component).bind(component);

            context.get(PageRenderCtl).renderPageBy(renderer, def);
          });
        });
      },
    },
  }));
}
