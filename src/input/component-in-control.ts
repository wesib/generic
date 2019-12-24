/**
 * @module @wesib/generic
 */
import { ComponentContext, DefinitionSetup } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { afterThe, EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentNode } from '../tree';
import { ComponentIn } from './component-in';
import { enableComponentIn } from './enable-component-in';

const ComponentInControl__key = /*#__PURE__*/ new SingleContextKey<ComponentInControl>('component-in-control');

/**
 * User input control maintained by component.
 *
 * An instance of this class intended to be constructed available component context. A [[setup]] method can be used for
 * that.
 *
 * To initiate user input, the component should obtain an instance from its context and [[enable]] it.
 */
export class ComponentInControl<Value = any> {

  /**
   * A key of component context value containing an component input control.
   */
  static get [ContextKey__symbol](): ContextKey<ComponentInControl> {
    return  ComponentInControl__key;
  }

  /**
   * Root component node.
   */
  readonly root: ComponentNode;

  /**
   * Sets up component definition to make it contain a component input control instance.
   *
   * @param setup  Target component definition setup.
   */
  static setup(setup: DefinitionSetup): void {
    setup.perComponent({ as: ComponentInControl });
    setup.perComponent({ a: ComponentIn, is: afterThe() });
  }

  /**
   * Constructs component user input control.
   *
   * Normally, a [[setup]] method should be used instead.
   *
   * @param context  Component context.
   */
  constructor(context: ComponentContext) {
    this.root = context.get(ComponentNode);
  }

  /**
   * Enables user input for the given control.
   *
   * Utilizes [[enableComponentIn]] for that.
   *
   * @param control  User input control to enable.
   *
   * @returns User input supply. The user input is disabled once this supply is cut off.
   */
  enable(control: InControl<Value>): EventSupply {
    return enableComponentIn({
      root: this.root,
      control,
    });
  }

}
