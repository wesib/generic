import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { BootstrapWindow, Component, ComponentContext, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { JSDOM } from 'jsdom';
import { MockElement, testElement } from '../spec/test-element';
import { ComponentNodeImpl } from './component-node.impl';
import { ComponentTreeSupport } from './component-tree-support.feature';

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

    jest.spyOn(context, 'onConnect').mockImplementation((listener: () => void) => connect = listener);
    jest.spyOn(context, 'onDisconnect').mockImplementation((listener: () => void) => disconnect = listener);

    jest.spyOn(context, 'contentRoot', 'get').mockReturnValue(element);
    (context as any).element = element;

    let connect: () => void = noop;
    let disconnect: () => void = noop;

    const impl = context.get(ComponentNodeImpl);

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
