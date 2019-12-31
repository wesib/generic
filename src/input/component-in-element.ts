/**
 * @module @wesib/generic
 */
import { ComponentContext, ComponentDef, ComponentDef__symbol } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, trackValue, ValueTracker } from 'fun-events';
import { InControl, InText } from 'input-aspects';
import { ComponentNode, ElementPickMode, ElementNode } from '../tree';
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
 * @param select  Input element selector.
 * @param pick  A mode of input element node picking from component tree.
 * @param build  Control builder function for selected element node.
 *
 * @returns A reference to component input element.
 */
export function componentInElement<Ctrl extends InControl<any>>(
    {
      select,
      pick = { all: true, deep: true },
      build,
    }: {
      select: string,
      pick?: ElementPickMode,
      build: ComponentInElement.Builder<Ctrl>,
    },
): ComponentInElement.Ref<Ctrl> {

  type CompInElement = ComponentInElement<Ctrl>;
  const CompInElement = new SingleContextKey<CompInElement>('component-in-element:' + select);

  type CompControl = ValueTracker<Ctrl | undefined>;
  const CompControl = new SingleContextKey<CompControl>('component-in-element:' + select + ':control');

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
          root.select(select, pick)
              .first.tillOff(supply)
              .thru_(node => node && build(node, root)),
      );
      compControl.read.tillOff(supply).consume(
          ctrl => ctrl && inControl.in(ctrl).whenOff(() => compControl.it = undefined),
      );
    });
  }
}
