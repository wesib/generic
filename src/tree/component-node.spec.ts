import Mocked = jest.Mocked;
import { ComponentContext } from '@wesib/wesib';
import { noop } from 'call-thru';
import { ContextRequest } from 'context-values';
import { JSDOM } from 'jsdom';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

describe('tree/component-node', () => {

  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM();
  });

  function newComponentNode() {

    let connect: () => void = noop;
    let disconnect: () => void = noop;
    const contentRoot: Element = dom.window.document.createElement('div');
    const context: Mocked<ComponentContext> = {
      get: jest.fn(),
      onConnect: jest.fn((listener: () => void) => connect = listener),
      onDisconnect: jest.fn((listener: () => void) => disconnect = listener),
      get contentRoot() {
        return contentRoot;
      }
    } as any;
    (contentRoot as any)[ComponentContext.symbol] = context;
    const impl = new ComponentNodeImpl(context);

    context.get.mockImplementation((request: ContextRequest<any>) => {
      if (request.key === ComponentNodeImpl.key) {
        return impl;
      }
      return;
    });

    return {
      connect,
      disconnect,
      contentRoot,
      context,
      impl,
      get node() {
        return impl.node;
      },
      get parent() {
        return this.node.parent;
      }
    };
  }

  describe('ComponentNodeImpl', () => {

    let node: ReturnType<typeof newComponentNode>;

    beforeEach(() => {
      node = newComponentNode();
    });

    it('caches node instance', () => {
      expect(node.node).toBe(node.node);
    });

    describe('parent', () => {

      let parent: ReturnType<typeof newComponentNode>;

      beforeEach(() => {
        parent = newComponentNode();
        parent.contentRoot.appendChild(node.contentRoot);
      });

      it('is `null` by default', () => {
        expect(node.parent).toBeNull();
      });
      it('is detected on connect', () => {
        node.connect();
        expect(node.parent).toMatchObject({
          context: parent.context,
        });
      });
      it('remains `null` if not found', () => {
        parent.contentRoot.removeChild(node.contentRoot);
        node.connect();
        expect(node.parent).toBeNull();
      });
      it('ignores non-component elements', () => {
        parent.contentRoot.removeChild(node.contentRoot);

        const nonComponentParent = dom.window.document.createElement('span');

        parent.contentRoot.appendChild(nonComponentParent);
        nonComponentParent.appendChild(node.contentRoot);

        node.connect();

        expect(node.parent).toMatchObject({
          context: parent.context,
        });
      });
      it('is lost on disconnect', () => {
        node.connect();
        node.disconnect();
        expect(node.parent).toBeNull();
      });
      it('notifies on update', () => {

        const onUpdate = jest.fn();

        node.node.onParentUpdate(onUpdate);
        expect(onUpdate).not.toHaveBeenCalled();

        node.connect();
        expect(onUpdate).toHaveBeenCalledWith(parent.node);

        onUpdate.mockClear();
        node.disconnect();
        expect(onUpdate).toHaveBeenCalledWith(null);
      });
    });

    describe('select', () => {
      it('selects child elements', () => {

      });
    });
  });
});
