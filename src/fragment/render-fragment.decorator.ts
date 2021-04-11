import { drekAppender, drekCharger, DrekFragment, DrekTarget } from '@frontmeans/drek';
import { EventEmitter } from '@proc7ts/fun-events';
import { valueByRecipe } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import {
  ComponentClass,
  ComponentContext,
  ComponentProperty,
  ComponentPropertyDecorator,
  ComponentRenderCtl,
  RenderDef,
} from '@wesib/wesib';
import { FragmentRendererExecution } from './fragment-renderer';

/**
 * Fragment rendering definition.
 *
 * This is either a {@link RenderFragmentDef.Spec rendering specifier}, or its {@link RenderFragmentDef.Provider
 * provider function}.
 */
export type RenderFragmentDef =
    | RenderFragmentDef.Spec
    | RenderDef.Provider<RenderFragmentDef.Spec>;

export namespace RenderFragmentDef {

  /**
   * Fragment rendering specifier.
   */
  export interface Spec extends RenderDef.Spec {

    /**
     * A rendering target to place the rendered fragment contents to.
     *
     * By default, the content will be wrapped into element with `display: contents;` CSS style and the wrapper element
     * will be appended to component's content root.
     */
    readonly target?: DrekTarget;

    /**
     * Whether to settle the rendered fragment contents prior to placing them to {@link target}.
     *
     * When enabled custom elements within rendered contents will be [upgraded], then settled by calling
     * `DrekFragment.settle()` method. This allows nested custom elements to render their contents offline into document
     * fragment prior to placing to the document.
     *
     * Enabled (`true`) by default.
     *
     * [upgraded]: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/upgrade
     */
    readonly settle?: boolean;

  }

}

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
    def: RenderFragmentDef = {},
): ComponentPropertyDecorator<(execution: FragmentRendererExecution) => void, TClass> {
  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(() => {

            const spec = valueByRecipe(def, context);
            const renderFragment = spec.settle === false
                ? RenderFragment$justRender
                : RenderFragment$settleThenRender;
            const { component } = context;
            const renderer = get(component).bind(component);
            const renderCtl = context.get(ComponentRenderCtl);
            const { target = RenderFragment$defaultTarget(context) } = spec;
            const fragment = new DrekFragment(target);

            let placeContent = (supply: Supply): void => {

              const on = new EventEmitter();

              renderCtl.renderBy(
                  () => renderFragment(fragment),
                  { on },
              ).needs(supply);

              // Next time just send a render signal.
              placeContent = _supply => on.send();
            };

            renderCtl.preRenderBy(
                preExec => {

                  let done = false;
                  const exec: FragmentRendererExecution = {
                    ...preExec,
                    fragment,
                    content: fragment.content,
                    postpone(postponed) {
                      preExec.postpone(() => postponed(exec));
                    },
                    renderBy(renderer) {
                      done = true;
                      preExec.renderBy(renderExec => {
                        renderFragment(fragment);
                        renderExec.renderBy(renderer);
                      });
                    },
                    done() {
                      done = true;
                      preExec.renderBy(({ supply }) => {
                        renderFragment(fragment);
                        supply.off();
                      });
                    },
                  };

                  renderer(exec);

                  if (!done) {
                    placeContent(preExec.supply);
                  }
                },
                spec,
            );
          });
        });
      },
    },
  }));
}

function RenderFragment$defaultTarget({ contentRoot }: ComponentContext): DrekTarget {
  return drekCharger(drekAppender(contentRoot));
}

function RenderFragment$settleThenRender(fragment: DrekFragment): void {
  fragment.innerContext.window.customElements.upgrade(fragment.content);
  fragment.settle();
  fragment.render();
}

function RenderFragment$justRender(fragment: DrekFragment): void {
  fragment.render();
}
