import Mocked = jest.Mocked;
import { ComponentContext } from '@wesib/wesib';
import { noop } from 'call-thru';
import { ContextKey, ContextRequest } from 'context-values';
import { JSDOM } from 'jsdom';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

describe('tree/component-node', () => {

  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM();
  });

  describe('ComponentNodeImpl', () => {

    let componentContextMock: Mocked<ComponentContext>;
    let impl: ComponentNodeImpl;
    let node: ComponentNode;
    let connect: () => void;
    let disconnect: () => void;
    let contentRoot: Element;

    beforeEach(() => {
      contentRoot = dom.window.document.createElement('div');
    });
    beforeEach(() => {
      connect = noop;
      disconnect = noop;

      componentContextMock = {
        onConnect: jest.fn((listener: () => void) => connect = listener),
        onDisconnect: jest.fn((listener: () => void) => disconnect = listener),
        get contentRoot() {
          return contentRoot;
        }
      } as any;
    });
    beforeEach(() => {
      impl = new ComponentNodeImpl(componentContextMock);
      node = impl.node;
    });

    it('caches node instance', () => {
      expect(impl.node).toBe(node);
    });

    describe('parent', () => {

      let parentContextMock: Mocked<ComponentContext>;
      let parentElement: Element;
      let parentImpl: ComponentNodeImpl;

      beforeEach(() => {
        parentContextMock = {
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          get: jest.fn((request: ContextRequest<any>) => {
            if (request.key === ComponentNodeImpl.key) {
              return parentImpl;
            }
            return;
          }),
        } as any;
        parentImpl = new ComponentNodeImpl(parentContextMock);
        parentElement = dom.window.document.createElement('div');
        parentElement.appendChild(contentRoot);
        (parentElement as any)[ComponentContext.symbol] = parentContextMock;
      });

      it('is `null` by default', () => {
        expect(node.parent).toBeNull();
      });
      it('is detected on connect', () => {
        connect();
        expect(node.parent).toMatchObject({
          context: parentContextMock,
        });
      });
      it('remains `null` if not found', () => {
        parentElement.removeChild(contentRoot);
        connect();
        expect(node.parent).toBeNull();
      });
      it('ignores non-component elements', () => {
        parentElement.removeChild(contentRoot);

        const nonComponentParent = dom.window.document.createElement('span');

        parentElement.appendChild(nonComponentParent);
        nonComponentParent.appendChild(contentRoot);

        connect();

        expect(node.parent).toMatchObject({
          context: parentContextMock,
        });
      });
      it('is lost on disconnect', () => {
        connect();
        disconnect();
        expect(node.parent).toBeNull();
      });
      it('notifies on update', () => {

        const onUpdate = jest.fn();

        node.onParentUpdate(onUpdate);
        expect(onUpdate).not.toHaveBeenCalled();

        connect();
        expect(onUpdate).toHaveBeenCalledWith(parentImpl.node);

        onUpdate.mockClear();
        disconnect();
        expect(onUpdate).toHaveBeenCalledWith(null);
      });
    });
  });
});
