import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { BootstrapWindow, Component, ComponentContext, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { JSDOM } from 'jsdom';
import { MockElement, testElement } from '../spec/test-element';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';
import { ComponentTreeSupport } from './component-tree-support.feature';

describe('tree/component-node', () => {

  let dom: JSDOM;
  let MockMutationObserver: Mock<MutationObserver>;

  beforeEach(() => {
    dom = new JSDOM();
  });

  let observer: Mocked<MutationObserver>;
  let mutate: (records: Partial<MutationRecord>[]) => void = noop;

  beforeEach(() => {
    MockMutationObserver = jest.fn();
    (dom.window as any).MutationObserver = MockMutationObserver;

    observer = {
      observe: jest.fn(),
      disconnect: jest.fn(),
    } as any;
    MockMutationObserver.mockImplementation((listener: (records: Partial<MutationRecord>[]) => void) => {
      mutate = listener;
      return observer;
    });
  });

  type ComponentNodeInfo = ReturnType<typeof newComponentNode>;

  function newComponentNode(name = 'div') {

    @Component({
      name,
      extend: {
        type: MockElement,
      },
    })
    @Feature({
      need: ComponentTreeSupport,
      set: { a: BootstrapWindow, is: dom.window },
    })
    class TestComponent {
    }

    const Element = testElement(TestComponent);
    const realElement = new Element();

    const context = ComponentContext.of(realElement);
    const element: Element = dom.window.document.createElement(name);

    (element as any)[ComponentContext.symbol] = context;

    let connect: () => void = noop;
    let disconnect: () => void = noop;

    jest.spyOn(context, 'onConnect').mockImplementation((listener: () => void) => connect = listener);
    jest.spyOn(context, 'onDisconnect').mockImplementation((listener: () => void) => disconnect = listener);

    jest.spyOn(context, 'contentRoot', 'get').mockReturnValue(element);
    (context as any).element = element;

    const node = context.get(ComponentNode);

    return {
      connect,
      disconnect,
      element,
      context,
      node,
      get parent() {
        return this.node.parent;
      }
    };
  }

  function nodeList(...nodes: Node[]): NodeList {
    return nodes as any;
  }

  describe('ComponentNodeImpl', () => {

    let node: ComponentNodeInfo;

    beforeEach(() => {
      node = newComponentNode();
    });

    it('caches node instance', () => {
      expect(node.context.get(ComponentNodeImpl).node).toBe(node.node);
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

      it('selects child elements', () => {
        expect([...node.node.select('test-component')]).toEqual([c1.node, c2.node]);
      });
      it('selects subtree elements with `deep` option', () => {
        expect([...node.node.select('test-component', { deep: true } )]).toEqual([c1.node, c2.node, c21.node]);
      });
      it('does not observe DOM mutations initially', () => {
        expect(observer.observe).not.toHaveBeenCalled();
      });
      it('observes DOM mutations', () => {

        const list = node.node.select('test-component');

        list.onUpdate(() => {});
        expect(observer.observe).toHaveBeenCalled();
      });
      it('disconnects when no more listeners', () => {

        const list = node.node.select('test-component');

        const interest1 = list.onUpdate(() => {});
        const interest2 = list.onUpdate(() => {});

        expect(observer.observe).toHaveBeenCalledTimes(1);

        interest1.off();
        expect(observer.disconnect).not.toHaveBeenCalled();

        interest2.off();
        expect(observer.disconnect).toHaveBeenCalled();
      });
      it('handles child removal', () => {

        const list = node.node.select('test-component');
        const onUpdateMock = jest.fn();

        list.onUpdate(onUpdateMock);

        expect(onUpdateMock).not.toHaveBeenCalled();

        mutate([{ addedNodes: nodeList(), removedNodes: nodeList(c2.element) }]);

        expect([...list]).toEqual([c1.node]);
        expect(onUpdateMock).toHaveBeenCalled();
        expect([...onUpdateMock.mock.calls[0][0]]).toEqual([c1.node]);
      });
      it('ignores irrelevant child removal', () => {

        const list = node.node.select('test-component');
        const onUpdateMock = jest.fn();

        list.onUpdate(onUpdateMock);

        expect(onUpdateMock).not.toHaveBeenCalled();

        mutate([{ addedNodes: nodeList(), removedNodes: nodeList(c3.element) }]);

        expect([...list]).toEqual([c1.node, c2.node]);
        expect(onUpdateMock).not.toHaveBeenCalled();
      });
      it('handles child addition', () => {

        const list = node.node.select('test-component');
        const onUpdateMock = jest.fn();

        list.onUpdate(onUpdateMock);

        expect(onUpdateMock).not.toHaveBeenCalled();

        mutate([{ addedNodes: nodeList(c3.element), removedNodes: nodeList() }]);

        expect([...list]).toEqual([c1.node, c2.node, c3.node]);
        expect(onUpdateMock).toHaveBeenCalled();
        expect([...onUpdateMock.mock.calls[0][0]]).toEqual([c1.node, c2.node, c3.node]);
      });
      it('ignores irrelevant child addition', () => {

        const list = node.node.select('test-component');
        const onUpdateMock = jest.fn();

        list.onUpdate(onUpdateMock);

        const irrelevant = dom.window.document.createElement('div');

        expect(onUpdateMock).not.toHaveBeenCalled();

        mutate([{ addedNodes: nodeList(irrelevant), removedNodes: nodeList() }]);

        expect([...list]).toEqual([c1.node, c2.node]);
        expect(onUpdateMock).not.toHaveBeenCalled();
      });
    });
  });
});
