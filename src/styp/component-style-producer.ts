/**
 * @module @wesib/generic
 */
import { SingleContextKey, SingleContextRef } from 'context-values';
import { EventSupply } from 'fun-events';
import { StypRules } from 'style-producer';
import { ComponentStypOptions } from './component-styp-options';

/**
 * Component style producer function interface.
 */
export type ComponentStyleProducer =
/**
 * @param rules  CSS rules to produce stylesheets for. This can be e.g. a `StypRule.rules` to render all rules,
 * or a result of `StypRuleList.grab()` method call to render only matching ones.
 * @param opts  Production options.
 *
 * @returns Styles supply. Once cut off (i.e. its `off()` method is called) the produced stylesheets are removed.
 */
    (
        rules: StypRules,
        opts?: ComponentStypOptions,
    ) => EventSupply;

/**
 * A key of component context value containing a component style producer.
 */
export const ComponentStyleProducer: SingleContextRef<ComponentStyleProducer> =
    (/*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer'));
