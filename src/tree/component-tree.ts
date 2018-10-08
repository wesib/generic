import { ContextValueKey, SingleValueKey } from '@wesib/wesib';

/**
 * A tree of components present on the page.
 *
 * It is available in bootstrap context under `[ComponentTree.key]` key once `ComponentTreeSupport` feature is enabled.
 */
export abstract class ComponentTree {

  /**
   * A key of bootstrap context value containing a component tree instance.
   */
  static readonly key: ContextValueKey<ComponentTree> = new SingleValueKey('component-tree');

  /**
   * A unique identifier of component tree.
   *
   * Each `bootstrapComponent()` invocation creates a unique instance of component tree. Each of these trees has its own
   * unique identifier to not mess the components from different trees.
   *
   * This identifier is used e.g. as part of attribute name appended to each component belonging to the same component
   * tree.
   */
  static readonly idKey: ContextValueKey<string> = new SingleValueKey(
      'component-tree-id',
      () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`);

}

function s4(): string {
  return Math.floor(Math.random() * 0x10000).toString(16);
}
