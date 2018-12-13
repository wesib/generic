import Mocked = jest.Mocked;
import { BootstrapWindow, ComponentContext } from '@wesib/wesib';
import { noop } from 'call-thru';
import { ContextRequest } from 'context-values';
import { JSDOM } from 'jsdom';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';
import Mock = jest.Mock;

describe('tree/component-node', () => {

  let dom: JSDOM;
  let MockMutationObserver: Mock<MutationObserver>;

  beforeEach(() => {
    dom = new JSDOM();
    MockMutationObserver = jest.fn();
    (dom.window as any).MutationObserver = MockMutationObserver;
  });

  type ComponentNodeInfo = ReturnType<typeof newComponentNode>;

  function newComponentNode(name = 'div') {

    let connect: () => void = noop;
    let disconnect: () => void = noop;
    const element: Element = dom.window.document.createElement(name);
    const context: Mocked<ComponentContext> = {
      get: jest.fn(),
      onConnect: jest.fn((listener: () => void) => connect = listener),
      onDisconnect: jest.fn((listener: () => void) => disconnect = listener),
      contentRoot: element,
      element,
    } as any;
    (element as any)[ComponentContext.symbol] = context;
    const impl = new ComponentNodeImpl(context);

    context.get.mockImplementation((request: ContextRequest<any>) => {
      if (request.key === ComponentNodeImpl.key) {
        return impl;
      }
      if (request.key === ComponentNode.key) {
        return impl.node;
      }
      if (request.key === BootstrapWindow.key) {
        return dom.window;
      }
      return;
    });

    return {
      connect,
      disconnect,
      element,
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

    let node: ComponentNodeInfo;

    beforeEach(() => {
      node = newComponentNode();
    });

    it('caches node instance', () => {
      expect(node.node).toBe(node.node);
    });

    describe('parent', () => {

      let parent: ComponentNodeInfo;

      beforeEach(() => {
        parent = newComponentNode();
        parent.element.appendChild(node.element);
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
        parent.element.removeChild(node.element);
        node.connect();
        expect(node.parent).toBeNull();
      });
      it('ignores non-component elements', () => {
        parent.element.removeChild(node.element);

        const nonComponentParent = dom.window.document.createElement('span');

        parent.element.appendChild(nonComponentParent);
        nonComponentParent.appendChild(node.element);

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

      let c1: ComponentNodeInfo;
      let c2: ComponentNodeInfo;
      let c21: ComponentNodeInfo;
      let c3: ComponentNodeInfo;

      beforeEach(() => {
        c1 = newComponentNode('test-component');
        c2 = newComponentNode('test-component');
        c21 = newComponentNode('test-component');
        c3 = newComponentNode('test-component-3');

        node.element.appendChild(c1.element);
        node.element.appendChild(c2.element);
        c2.element.appendChild(c21.element);
        node.element.appendChild(c3.element);
      });

      let observer: Mocked<MutationObserver>;

      beforeEach(() => {
        observer = {} as any;
        MockMutationObserver.mockReturnValueOnce(observer);
      });

      it('selects child elements', () => {
        expect([...node.node.select('test-component')]).toEqual([c1.node, c2.node]);
      });
      it('selects subtree elements with `deep` option', () => {
        expect([...node.node.select('test-component', { deep: true } )]).toEqual([c1.node, c2.node, c21.node]);
      });
    });
  });
});
