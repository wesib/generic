/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { MultiContextKey, MultiContextRef } from 'context-values';
import { StypRenderer } from 'style-producer';

/**
 * A CSS renderer that will be enabled by default by [[ComponentStyleProducer]].
 */
export type ComponentStypRenderer = StypRenderer;

/**
 * A key of component context value containing component CSS renderers.
 */
export const ComponentStypRenderer: MultiContextRef<ComponentStypRenderer> = (
    /*#__PURE__*/ new MultiContextKey<ComponentStypRenderer>('component-styp-renderer')
);
