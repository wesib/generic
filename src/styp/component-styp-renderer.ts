/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { MultiContextKey, MultiContextRef } from '@proc7ts/context-values';
import { StypRenderer } from '@proc7ts/style-producer';

/**
 * A CSS renderer that will be enabled by default by {@link ComponentStypFormat component style production format}.
 */
export type ComponentStypRenderer = StypRenderer;

/**
 * A key of component context value containing component CSS renderers.
 */
export const ComponentStypRenderer: MultiContextRef<ComponentStypRenderer> = (
    /*#__PURE__*/ new MultiContextKey<ComponentStypRenderer>('component-styp-renderer')
);
