import Mocked = jest.Mocked;
import { ComponentContext } from '@wesib/wesib';
import { noop } from 'call-thru';
import { ComponentNode } from './component-node';
import { ComponentNodeImpl } from './component-node.impl';

describe('tree/component-node', () => {
  describe('ComponentNodeImpl', () => {

    let componentContextMock: Mocked<ComponentContext>;
    let impl: ComponentNodeImpl;
    let node: ComponentNode;
    let onConnect: () => void;
    let onDisconnect: () => void;

    beforeEach(() => {
      onConnect = noop;
      onDisconnect = noop;

      componentContextMock = {
        onConnect: jest.fn((listener: () => void) => onConnect = listener),
        onDisconnect: jest.fn((listener: () => void) => onDisconnect = listener),
      } as any;
    });
    beforeEach(() => {
      impl = new ComponentNodeImpl(componentContextMock);
      node = impl.node;
    });

    it('caches node instance', () => {
      expect(impl.node).toBe(node);
    });

  });
});
