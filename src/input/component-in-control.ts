/**
 * @module @wesib/generic
 */
import { ComponentContext, ComponentDef, ComponentDef__symbol } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { EventSupply } from 'fun-events';
import { InControl } from 'input-aspects';
import { ComponentTreeSupport } from '../tree';
import { ComponentInReceiver } from './component-in-receiver';
import { receiveComponentIn } from './receive-component-in';

const ComponentInControl__key = (/*#__PURE__*/ new SingleContextKey<ComponentInControl>('component-in-control'));

const ComponentInControl__component: ComponentDef = {
  feature: {
    needs: ComponentTreeSupport,
  },
  setup(setup) {
    setup.perComponent({ as: ComponentInControl });
    setup.perComponent({ a: ComponentInReceiver, via: ComponentInControl });
  },
};

/**
 * User input control maintained by component.
 *
 * An instance of this class intended to be available in component context. The class can be used as component
 * definition source for that.
 *
 * To initiate user input, the component should obtain an instance from its context and {@link in enable}} it.
 *
 * Usage example:
 * ```typescript
 * @Component(
 *   'my-component',     // Custom element name
 *   ComponentInControl, // Provide input control for component
 * )
 * class MyComponent {
 *   constructor(context: ComponentContext) {
 *
 *     const control = context.get(ComponentInControl); // Provided input control
 *
 *     // Enable input on `#my-element` input element.
 *     context.get(ComponentNode)
 *        .select('#my-input', { all: true, deep: true })
 *        .first.consume(input => input && control.in(input));
 *   }
 * }
 * ```
 */
export class ComponentInControl<Value = any> implements ComponentInReceiver {

  /**
   * A key of component context value containing an component input control.
   */
  static get [ContextKey__symbol](): ContextKey<ComponentInControl> {
    return  ComponentInControl__key;
  }

  /**
   * Component definition that sets up an input control for the component.
   *
   * Enables [[ComponentTreeSupport]].
   */
  static get [ComponentDef__symbol](): ComponentDef {
    return ComponentInControl__component;
  }

  /**
   * Root component context.
   */
  readonly root: ComponentContext;

  /**
   * Constructs component user input control.
   *
   * Normally, an instance should not be constructed directly. The class should be used instead to provide one for
   * component context. E.g. by passing it to `@Component` decorator.
   *
   * @param root  Root component context.
   */
  constructor(root: ComponentContext) {
    this.root = root;
  }

  /**
   * Starts receiving user input from the given control.
   *
   * Utilizes [[receiveComponentIn]] for that.
   *
   * @param control  User input control to enable.
   *
   * @returns User input supply. The user input is disabled once this supply is cut off.
   */
  in(control: InControl<Value>): EventSupply {
    return receiveComponentIn(this, control);
  }

}
