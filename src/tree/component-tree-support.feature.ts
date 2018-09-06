import { BootstrapContext, WesFeature } from '@wesib/wesib';

/**
 * Component tree support feature.
 */
@WesFeature({
  configure: enableComponentTree,
})
export class ComponentTreeSupport {
}

function enableComponentTree(context: BootstrapContext) {
  // TODO Implement component tree
}
