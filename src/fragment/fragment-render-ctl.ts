import { drekAppender, drekCharger, DrekFragment, DrekTarget } from '@frontmeans/drek';
import { CxEntry, cxSingle } from '@proc7ts/context-values';
import { lazyValue, valueByRecipe } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentContext, ComponentRenderCtl, DefaultPreRenderScheduler } from '@wesib/wesib';
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
 * Component context entry containing {@link FragmentRenderCtl fragment render control}.
 */
export const FragmentRenderCtl: CxEntry<FragmentRenderCtl> = {
  perContext: (/*#__PURE__*/ cxSingle({
    byDefault: target => new FragmentRenderCtl$(target.get(ComponentContext)),
  })),
  toString: () => '[FragmentRenderCtl]',
};

const RenderFragment$done = {};

class FragmentRenderCtl$ implements FragmentRenderCtl {

  constructor(private readonly _context: ComponentContext) {
  }

  renderFragmentBy(renderer: FragmentRenderer, def: RenderFragmentDef = {}): Supply {

    const spec = valueByRecipe(def, this._context);
    const doRenderFragment = spec.settle === false
        ? RenderFragment$justRender
        : RenderFragment$settleThenRender;
    const renderFragment = (fragment: DrekFragment, retainContent: boolean): void => {
      if (!retainContent) {
        doRenderFragment(fragment);
      }
    };
    const { target = RenderFragment$defaultTarget } = spec;
    const getTarget: () => DrekTarget = lazyValue(() => target(this._context));
    const renderCtl = this._context.get(ComponentRenderCtl);
    const scheduler = this._context.get(DefaultPreRenderScheduler);
    const supply = new Supply();
    const renderSupply = renderCtl.preRenderBy(
        preExec => {

          const fragment = new DrekFragment(getTarget(), { scheduler });
          let retainContent = false;
          const exec: FragmentRendererExecution = {
            ...preExec,
            supply,
            fragment,
            content: fragment.content,
            postpone(postponed) {
              preExec.postpone(() => postponed(exec));
            },
            renderBy(renderer) {
              preExec.renderBy(renderExec => {
                renderExec.renderBy(renderer);
              });
            },
            retainContent(retain = true) {
              retainContent = retain;
            },
            done() {
              preExec.renderBy(({ supply }) => {
                renderSupply.as(supply).off(RenderFragment$done);
              });
            },
          };

          renderer(exec);
          renderFragment(fragment, retainContent);
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

  const { innerContext } = fragment;
  const { window } = innerContext;

  innerContext.scheduler()(() => {
    window.customElements.upgrade(fragment.content);
  });
  fragment.settle();
  fragment.render();
}

function RenderFragment$justRender(fragment: DrekFragment): void {
  fragment.render();
}
