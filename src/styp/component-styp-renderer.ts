import { StypRenderer } from '@frontmeans/style-producer';
import { MultiContextKey, MultiContextRef } from '@proc7ts/context-values';

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
