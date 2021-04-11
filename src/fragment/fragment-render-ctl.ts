import { drekAppender, drekCharger, DrekFragment, DrekTarget } from '@frontmeans/drek';
import { ContextKey, SingleContextKey } from '@proc7ts/context-values';
import { EventEmitter } from '@proc7ts/fun-events';
import { valueByRecipe } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentContext, ComponentRenderCtl } from '@wesib/wesib';
import { FragmentRenderer, FragmentRendererExecution } from './fragment-renderer';
import { RenderFragmentDef } from './render-fragment-def';

/**
 * Fragment render control.
 *
 * Controls rendering by {@link FragmentRenderer fragment renderers}.
 *
 * Available in component context.
 */
export interface FragmentRenderCtl {

  /**
   * Enables fragment rendering by the given `renderer`.
   *
   * A `renderer` call will be scheduled by {@link DocumentRenderKit document render kit} once component state updated.
   *
   * @param renderer - Fragment renderer function.
   * @param def - Optional fragment rendering definition.
   *
   * @returns Renderer supply. The rendering would stop once this supply is cut off.
   */
  renderFragmentBy(renderer: FragmentRenderer, def?: RenderFragmentDef): Supply;

}

/**
 * A key of component context value containing {@link FragmentRenderCtl fragment render control}.
 */
export const FragmentRenderCtl: ContextKey<FragmentRenderCtl> = (
    /*#__PURE__*/ new SingleContextKey(
        'fragment-render-ctl',
        {
          byDefault(context) {
            return new FragmentRenderCtl$(context.get(ComponentContext));
          },
        },
    )
);

const RenderFragment$done = {};

class FragmentRenderCtl$ implements FragmentRenderCtl {

  constructor(private readonly _context: ComponentContext) {
  }

  renderFragmentBy(renderer: FragmentRenderer, def: RenderFragmentDef = {}): Supply {

    const spec = valueByRecipe(def, this._context);
    const renderFragment = spec.settle === false
        ? RenderFragment$justRender
        : RenderFragment$settleThenRender;
    const renderCtl = this._context.get(ComponentRenderCtl);
    const { target = RenderFragment$defaultTarget(this._context) } = spec;
    const fragment = new DrekFragment(target);

    let placeContent = (supply: Supply): void => {

      const on = new EventEmitter();

      supply.cuts(on);
      renderCtl.renderBy(
          () => renderFragment(fragment),
          { on },
      ).needs(supply);

      // Next time just send a render signal.
      placeContent = _supply => {
        on.send();
      };
    };

    const supply = new Supply();

    const renderSupply = renderCtl.preRenderBy(
        preExec => {

          let done = false;
          const exec: FragmentRendererExecution = {
            ...preExec,
            supply,
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
              preExec.renderBy(({ supply: rSupply }) => {
                renderFragment(fragment);
                renderSupply.as(rSupply).off(RenderFragment$done);
              });
            },
          };

          renderer(exec);

          if (!done) {
            placeContent(preExec.supply);
          }
        },
        spec,
    ).needs(
        supply,
    ).whenOff(reason => {
      if (reason !== RenderFragment$done) {
        supply.off(reason);
      }
    });

    return supply;
  }

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
