/**
 * @module @wesib/generic
 */
import { MultiContextKey, MultiContextRef } from 'context-values';
import { EventKeeper, EventSupply } from 'fun-events';
import { ComponentInContext } from './component-in-context';

/**
 * Component input - a component's participant in user input.
 *
 * A component participating in user input should have component input instance in its context.
 *
 * This is a function invoked by parent component to enable participation in user input. E.g. via input aspects.
 */
export type ComponentIn =
/**
 * @param context  A context of component input to participate in.
 *
 * @returns A participation supply. When this supply is cut off the participation is disabled.
 */
    (this: void, context: ComponentInContext) => EventSupply;

/**
 * A key of component context value containing an array of event keepers sending component inputs.
 */
export const ComponentIn: MultiContextRef<EventKeeper<ComponentIn[]>> =
    (/*#__PURE__*/ new MultiContextKey<EventKeeper<ComponentIn[]>>('component-in'));
