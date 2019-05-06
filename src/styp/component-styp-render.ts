import { ContextRequest, ContextTarget, MultiContextKey } from 'context-values';
import { StypRender } from 'style-producer';

/**
 * A CSS render that will be enabled by default by [[ComponentStyleProducer]].
 */
export type ComponentStypRender = StypRender;

/**
 * A key of component context value containing component CSS renders.
 */
export const ComponentStypRender: ContextTarget<ComponentStypRender> & ContextRequest<ComponentStypRender[]> =
    /*#__PURE__*/ new MultiContextKey<ComponentStypRender>('component-styp-render');
