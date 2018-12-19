import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { BootstrapWindow, Component, ComponentContext, DomProperty, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { JSDOM } from 'jsdom';
import { MockElement, testElement } from '../spec/test-element';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';
import { ComponentTreeSupport } from './component-tree-support.feature';
import { ValueTracker } from './value-tracker';

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
      takeRecords: jest.fn().mockImplementation(() => []),
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

    describe('property', () => {

      let element: any;
      let property: ValueTracker<string>;

      beforeEach(() => {

        @Component({
          name: 'test-component',
          extend: {
            type: MockElement,
          },
        })
        @Feature({
          need: ComponentTreeSupport,
          set: { a: BootstrapWindow, is: dom.window },
        })
        class TestComponent {

          @DomProperty()
          property = 'value';

        }

        element = new (testElement(TestComponent))();
        property = ComponentContext.of(element).get(ComponentNode).property('property');
      });

      it('reads property value', () => {
        expect(property.it).toBe('value');

        const newValue = 'new value';

        element.property = newValue;

        expect(property.it).toBe(newValue);
      });
      it('updates property value', () => {

        const newValue = 'new value';

        property.it = newValue;

        expect(property.it).toBe(newValue);
        expect(element.property).toBe(newValue);
      });
      it('notifies on property updates', () => {

        const newValue = 'new value';
        const onUpdate = jest.fn();

        property.on(onUpdate);

        element.property = newValue;
        expect(onUpdate).toHaveBeenCalledWith(newValue, 'value');
      });
    });

    describe('attribute', () => {

      let element: any;
      let compNode: ComponentNode;
      let attribute: ValueTracker<string, string | null>;

      beforeEach(() => {

        @Component({
          name: 'test-component',
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

        element = new (testElement(TestComponent))();
        compNode = ComponentContext.of(element).get(ComponentNode);
        attribute = compNode.attribute('attr');
      });

      function setAttribute(name: string, value: string, oldValue: string) {
        element.setAttribute(name, value);
        mutate([{ type: 'attributes', oldValue, attributeName: name }]);
      }

      it('reads attribute value', () => {
        expect(attribute.it).toBeNull();

        const newValue = 'new value';

        element.setAttribute('attr', newValue);

        expect(attribute.it).toBe(newValue);
      });
      it('updates attribute value', () => {

        const newValue = 'new value';

        attribute.it = newValue;

        expect(attribute.it).toBe(newValue);
        expect(element.getAttribute('attr')).toBe(newValue);
      });
      it('does not observe attributes mutations initially', () => {
        expect(observer.observe).not.toHaveBeenCalled();
      });
      it('notifies on attribute updates', () => {

        const oldValue = 'old value';
        const newValue = 'new value';
        const onUpdate = jest.fn();

        attribute.on(onUpdate);

        setAttribute('attr', newValue, oldValue);
        expect(onUpdate).toHaveBeenCalledWith(newValue, oldValue);
      });
      it('does not notify on another attribute updates', () => {

        const oldValue = 'old value';
        const newValue = 'new value';
        const onUpdate = jest.fn();

        attribute.on(onUpdate);

        setAttribute('other-attr', newValue, oldValue);
        expect(onUpdate).not.toHaveBeenCalled();
      });
      it('handles multiple consumers of the same attribute updates', () => {

        const value0 = 'old value';
        const value1 = 'new value';
        const value2 = 'value 2';
        const onUpdate1 = jest.fn();
        const onUpdate2 = jest.fn();

        const interest1 = attribute.on(onUpdate1);
        const interest2 = attribute.on(onUpdate2);

        observer.disconnect.mockClear();

        setAttribute('attr', value1, value0);
        expect(onUpdate1).toHaveBeenCalledWith(value1, value0);
        expect(onUpdate2).toHaveBeenCalledWith(value1, value0);

        onUpdate1.mockClear();
        onUpdate2.mockClear();

        interest1.off();
        expect(observer.disconnect).not.toHaveBeenCalled();

        setAttribute('attr', value2, value1);
        expect(onUpdate1).not.toHaveBeenCalled();
        expect(onUpdate2).toHaveBeenCalledWith(value2, value1);

        interest2.off();
        expect(observer.disconnect).toHaveBeenCalled();
      });
      it('handles multiple attributes consumers', () => {

        const attribute2 = compNode.attribute('attr2');

        const value0 = 'old value';
        const value1 = 'new value';
        const value2 = 'value 2';
        const value3 = 'value 3';
        const onUpdate1 = jest.fn();
        const onUpdate2 = jest.fn();

        const interest1 = attribute.on(onUpdate1);
        const interest2 = attribute2.on(onUpdate2);

        observer.disconnect.mockClear();

        element.setAttribute('attr', value1);
        element.setAttribute('attr2', value2);
        mutate([
          { type: 'attributes', oldValue: value0, attributeName: 'attr' },
          { type: 'attributes', oldValue: value0, attributeName: 'attr2' },
        ]);
        expect(onUpdate1).toHaveBeenCalledWith(value1, value0);
        expect(onUpdate2).toHaveBeenCalledWith(value2, value0);

        onUpdate1.mockClear();
        onUpdate2.mockClear();

        interest1.off();
        expect(observer.disconnect).not.toHaveBeenCalled();

        setAttribute('attr2', value3, value2);
        expect(onUpdate1).not.toHaveBeenCalled();
        expect(onUpdate2).toHaveBeenCalledWith(value3, value2);

        interest2.off();
        expect(observer.disconnect).toHaveBeenCalled();
      });
    });
  });
});
