/**
 * @module @wesib/generic
 */
import { ComponentDef, ComponentDef__symbol } from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { AfterEvent, afterThe, trackValue, ValueTracker } from 'fun-events';
import { InValidation, inValidationResult } from 'input-aspects';
import { ComponentIn } from './component-in';

/**
 * A validity of user input initiated by component.
 *
 * This is an `AfterEvent` keeper of input validation result. Should be nested in {@link ComponentInReceiver user
 * input receiver}. E.g. by placing [[ComponentInValidity]] to `@Component()` decorator of nested component.
 */
export type ComponentInValidity = AfterEvent<[InValidation.Result]>;

const ComponentInValidity__key =
    (/*#__PURE__*/ new SingleContextKey<ComponentInValidity>('component-in-validity'));

type ComponentInValidityTracker = ValueTracker<InValidation.Result>;
const ComponentInValidityTracker =
    (/*#__PURE__*/ new SingleContextKey<ComponentInValidityTracker>('context-in-validity:tracker'));

const ComponentInValidity__component: ComponentDef = {
  setup(setup) {
    setup.perComponent({ a: ComponentInValidityTracker, is: trackValue(inValidationResult()) });
    setup.perComponent({ a: ComponentIn, by: componentInValidity, with: [ComponentInValidityTracker] });
    setup.perComponent({
      a: ComponentInValidity,
      by: (tracker: ComponentInValidityTracker) => tracker.read,
      with: [ComponentInValidityTracker],
    });
  },
};

export const ComponentInValidity = {

  /**
   * A key of component context value containing component input validity.
   */
  get [ContextKey__symbol](): ContextKey<ComponentInValidity> {
    return ComponentInValidity__key;
  },

  /**
   * Component definition that sets up input validity.
   */
  get [ComponentDef__symbol](): ComponentDef {
    return ComponentInValidity__component;
  },

};

function componentInValidity(tracker: ComponentInValidityTracker): AfterEvent<[ComponentIn.Participant]> {
  return afterThe(
      ({ control }) => control.aspect(InValidation)
          .read(result => tracker.it = result)
          .whenOff(() => tracker.it = inValidationResult()),
  );
}
