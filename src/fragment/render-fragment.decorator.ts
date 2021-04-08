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
  ComponentRenderer,
  DefaultPreRenderScheduler,
  RenderDef,
} from '@wesib/wesib';
import { FragmentRendererExecution } from './fragment-renderer';

export type RenderFragmentDef<TSpec extends RenderFragmentDef.Spec = RenderFragmentDef.Spec> =
  | RenderFragmentDef.Spec
  | RenderDef.Provider<TSpec>;

export namespace RenderFragmentDef {

  export interface Spec extends RenderDef.Spec {

    readonly target?: DrekTarget;

    readonly settle?: boolean;

  }

}

export function RenderFragment<TClass extends ComponentClass>(
    def: RenderFragmentDef = {},
): ComponentPropertyDecorator<(execution: FragmentRendererExecution) => void, TClass> {
  return ComponentProperty(({ get }) => ({
    componentDef: {
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(() => {

            const spec = valueByRecipe(def, context);
            const { settle = true } = spec;
            const { component } = context;
            const renderer = get(component).bind(component);
            const preScheduler = context.get(DefaultPreRenderScheduler);
            const renderCtl = context.get(ComponentRenderCtl);
            const { target = RenderFragment$defaultTarget(context) } = spec;
            const fragment = new DrekFragment(target, { scheduler: preScheduler });

            let placeContent = (supply: Supply): void => {

              const on = new EventEmitter();

              renderCtl.renderBy(() => fragment.render(), { on }).needs(supply);

              // Just send a render signal on attempt to render content next time.
              placeContent = _supply => on.send();

              placeContent(supply);
            };

            renderCtl.preRenderBy(
                preExec => {
                  fragment.innerContext.scheduler()(fragExec => {

                    let nextRenderer: ComponentRenderer | undefined;
                    const exec: FragmentRendererExecution = {
                      ...fragExec,
                      ...preExec,
                      postpone(postponed) {
                        fragExec.postpone(() => postponed(exec));
                      },
                      renderBy(renderer) {
                        nextRenderer = renderer;
                      },
                      done() {
                        nextRenderer = ({ supply }) => {
                          // Place the rendered content to the document.
                          supply.off();
                        };
                      },
                    };

                    renderer(exec);

                    if (settle) {
                      fragExec.postpone(() => {
                        fragment.innerContext.window.customElements.upgrade(fragment.content);
                        fragment.settle();
                      });
                    }

                    if (nextRenderer) {
                      // Delegate rendering to the next renderer.
                      preExec.renderBy(renderExec => {
                        fragment.render();
                        nextRenderer!(renderExec);
                      });
                    } else {
                      // Just place the rendered content.
                      // This may happen again.
                      placeContent(preExec.supply);
                    }
                  });
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
