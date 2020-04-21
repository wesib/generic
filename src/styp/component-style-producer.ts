/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { SingleContextKey, SingleContextRef } from '@proc7ts/context-values';
import { EventSupply } from '@proc7ts/fun-events';
import { StypFormat, StypRules } from '@proc7ts/style-producer';

/**
 * Component style producer signature.
 */
export type ComponentStyleProducer =
/**
 * @param rules  CSS rules to produce stylesheets for. This can be e.g. a `StypRule.rules` to render all rules,
 * or a result of `StypRuleList.grab()` method call to render only matching ones.
 * @param format  Style production format.
 *
 * @returns Styles supply. Once cut off (i.e. its `off()` method is called) the produced stylesheets are removed.
 */
    (
        rules: StypRules,
        format: StypFormat,
    ) => EventSupply;

/**
 * A key of component context value containing a component style producer.
 */
export const ComponentStyleProducer: SingleContextRef<ComponentStyleProducer> = (
    /*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer')
);
