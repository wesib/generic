import { WebFeature, BootstrapContext } from '@webcbb/webcbb';

/**
 * Component tree support feature.
 */
@WebFeature({
  configure: enableComponentTree,
})
export class ComponentTreeSupport {
}

function enableComponentTree(context: BootstrapContext) {
  // TODO Implement component tree
}
