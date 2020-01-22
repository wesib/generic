/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { MultiContextKey, MultiContextRef } from 'context-values';
import { StypRender } from 'style-producer';

/**
 * A CSS render that will be enabled by default by [[ComponentStyleProducer]].
 */
export type ComponentStypRender = StypRender;

/**
 * A key of component context value containing component CSS renders.
 */
export const ComponentStypRender: MultiContextRef<ComponentStypRender> = (
    /*#__PURE__*/ new MultiContextKey<ComponentStypRender>('component-styp-render')
);
