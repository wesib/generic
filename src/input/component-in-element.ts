/**
 * @module @wesib/generic
 */
import { ComponentContext, ComponentDef, ComponentDef__symbol } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, trackValue, ValueTracker } from 'fun-events';
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
     * Component definition that attaches input element control to component.
     *
     * Also attaches [[ComponentInControl]] to component.
     */
    readonly [ComponentDef__symbol]: ComponentDef;

  }

  /**
   * Input control builder function signature.
   *
   * Build input control for selected input element.
   */
  export type Builder<Ctrl extends InControl<any>> =
  /**
   * @typeparam Ctrl  A type of input control.
   * @param node  Selected input element node.
   * @param root  A node of component that initiated the user input and containing selected element.
   *
   * @returns Input control.
   */
      (this: void, node: ElementNode, root: ComponentNode) => Ctrl;

}

/**
 * Creates a reference to {@link ComponentInElement component input element control}.
 *
 * The input attached to component by this reference searches for the first element matching CSS `selector` in
 * component's content and creates an input control control for it by calling a `control` function.
 *
 * @param selector  Input element selector.
 * @param selectorOpts  Element node selector options. By default selects any matching element within subtree.
 * @param control  Control builder function for selected element node.
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
      control: ComponentInElement.Builder<Ctrl>,
    },
): ComponentInElement.Ref<Ctrl> {

  type CompInElement = ComponentInElement<Ctrl>;
  const CompInElement = new SingleContextKey<CompInElement>('component-in-element:' + selector);

  type CompControl = ValueTracker<Ctrl | undefined>;
  const CompControl = new SingleContextKey<CompControl>('component-in-element:' + selector + ':control');

  const def = ComponentDef.all(
      ComponentInControl,
      {
        define(context) {
          context.perComponent({ a: CompControl, by: trackValue });
          context.perComponent({
            a: CompInElement,
            by: (ctrl: CompControl) => ctrl.read,
            with: [CompControl],
          });
          context.onComponent(enableInput);
        },
      },
  );

  return {
    get [ContextKey__symbol]() {
      return CompInElement;
    },
    get [ComponentDef__symbol]() {
      return def;
    },
  };

  function enableInput(context: ComponentContext) {

    const compControl = context.get(CompControl);
    const inControl = context.get(ComponentInControl);
    const root = context.get(ComponentNode);

    context.whenOn(supply => {
      compControl.by(
          root.select(selector, selectorOpts as ElementNode.ElementSelectorOpts)
              .first.tillOff(supply)
              .thru_(node => node && control(node, root)),
      );
      compControl.read.tillOff(supply).consume(
          ctrl => ctrl && inControl.in(ctrl).whenOff(() => compControl.it = undefined),
      );
    });
  }
}
