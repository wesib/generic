/**
 * @module @wesib/generic
 */
import { ComponentClass, ComponentContext, ComponentDef, ComponentDef__symbol } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, eventSupply, noEventSupply, trackValue, ValueTracker } from 'fun-events';
import { InControl, InText } from 'input-aspects';
import { ComponentNode, ElementNode } from '../tree';
import { ComponentInControl } from './component-in-control';

/**
 * Component input control created for input element.
 *
 * This is an `AfterEvent` keeper of constructed input control, if any.
 *
 * A [[componentInElement]] function call result attaches such control to component.
 *
 * @typeparam Ctrl  A type of input control. `InText` by default.
 */
export type ComponentInElement<Ctrl extends InControl<any> = InText> = AfterEvent<[Ctrl?]>;

export namespace ComponentInElement {

  /**
   * A reference to {@link ComponentInElement component input element control} that can be used to attach such control
   * to component and retrieve it from this component's context.
   *
   * An instance of this type can be constructed by [[componentInElement]] function.
   *
   * @typeparam Ctrl  A type of input control. `InText` by default.
   */
  export interface Ref<Ctrl extends InControl<any> = InText> {

    /**
     * A key of component context value containing component input element control.
     */
    readonly [ContextKey__symbol]: ContextKey<ComponentInElement<Ctrl>>;

    /**
     * Builds component definition that attaches input element control to component.
     *
     * Also attaches [[ComponentInControl]] to component.
     *
     * @returns Component definition.
     */
    [ComponentDef__symbol](componentType: ComponentClass): ComponentDef;

  }

}

/**
 * Creates a reference to {@link ComponentInElement component input element control}.
 *
 * The input attached to component by this reference searches for the first element matching CSS `selector` in
 * component's content and creates an input control control for it by calling a `control` function.
 *
 * @param selector  Input element selector.
 * @param selectorOpts  Element node selector options. By default selects any matching element within subtree.
 * @param control  A function that constructs input control for selected element node.
 *
 * @returns A reference to component input element.
 */
export function componentInElement<Ctrl extends InControl<any>>(
    {
      selector,
      selectorOpts = { all: true, deep: true },
      control,
    }: {
      selector: string,
      selectorOpts?: ElementNode.SelectorOpts,
      control: (node: ElementNode.Any) => Ctrl,
    },
): ComponentInElement.Ref<Ctrl> {

  type CompElement = ComponentInElement<Ctrl>;
  const CompElement = new SingleContextKey<CompElement>('component-in-element:' + selector);

  type CompControl = ValueTracker<Ctrl | undefined>;
  const CompControl = new SingleContextKey<CompControl>('component-in-element:' + selector + ':control');

  const def: ComponentDef = {
    define(context) {
      context.perComponent({ a: CompControl, by: trackValue });
      context.perComponent({
        a: CompElement,
        by: (ctrl: CompControl) => ctrl.read,
        with: [CompControl],
      });
      context.onComponent(enableInput);
    },
  };

  return {
    get [ContextKey__symbol]() {
      return CompElement;
    },
    [ComponentDef__symbol](componentType) {
      return ComponentDef.merge(
          ComponentDef.for(componentType, ComponentInControl),
          def,
      );
    },
  };

  function enableInput(context: ComponentContext) {

    const compControl = context.get(CompControl);
    const inControl = context.get(ComponentInControl);
    const root = context.get(ComponentNode);

    context.whenOn(onSupply => {

      const supply = eventSupply().needs(onSupply);
      let inSupply = noEventSupply();

      root.select(selector, selectorOpts as ElementNode.ElementSelectorOpts).first({
        supply,
        receive: (_ctx, node) => {
          compControl.it = node && control(node);
        },
      });
      compControl.read({
        supply,
        receive: (_ctx, ctrl) => {
          inSupply.off();
          if (ctrl) {
            inSupply = inControl.in(ctrl)
                .needs(supply)
                .whenOff(() => compControl.it = undefined);
          }
        },
      });
    });
  }
}
