import { BootstrapContext, ComponentContext, ContextValues, EventEmitter, SingleValueKey } from '@wesib/wesib';
import { ComponentNode as ComponentNode_, ComponentNodeListener } from './component-node';
import { ComponentTree, ComponentTree as ComponentTree_ } from './component-tree';

const treeImplKey = new SingleValueKey<ComponentTreeImpl>('component-tree:impl');

export class ComponentNodeImpl<T extends object = object> {

  static readonly uidKey = new SingleValueKey<string>('component-node:uid');
  static readonly key = new SingleValueKey<ComponentNodeImpl<any>>('component-node:impl');

  readonly nodes = new EventEmitter<ComponentNodeListener>();
  private readonly _tree: ComponentTreeImpl;
  private _node?: ComponentNode_<T>;

  constructor(private readonly _context: ComponentContext<T>) {
    this._tree = _context.get(treeImplKey);
  }

  get node(): ComponentNode_<T> {
    if (this._node) {
      return this._node;
    }

    const impl = this;

    class ComponentNode extends ComponentNode_<T> {

      get context() {
        return impl._context;
      }

      get path() {
        // TODO component node path
        return [];
      }

      get parent() {
        // TODO parent components
        return null;
      }

      get nested() {
        // TODO nested components
        return [];
      }

      get on() {
        // TODO node tree updates
        return impl.nodes.on;
      }

    }

    return new ComponentNode();
  }

}

export class ComponentTreeImpl {

  static readonly key = treeImplKey;
  readonly id: string;
  private _tree?: ComponentTree_;

  constructor(context: BootstrapContext) {
    this.id = context.get(ComponentTree_.idKey);
  }

  get tree(): ComponentTree_ {
    if (this._tree) {
      return this._tree;
    }

    class ComponentTree extends ComponentTree_ {
    }

    return new ComponentTree();
  }

}

export function treeAttribute(ctx: ContextValues) {

  const treeId = ctx.get(ComponentTree.idKey);

  if (treeId) {
    return `wesib-${treeId}-tree`;
  }

  return `wesib-tree`;
}
