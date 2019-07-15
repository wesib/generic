import {
  bootstrapComponents,
  BootstrapRoot,
  BootstrapWindow,
  Class,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentContext__symbol,
  ElementAdapter,
  Feature,
} from '@wesib/wesib';
import { ObjectMock } from '../spec/mocks';
import { MockElement } from '../spec/test-element';
import { Mount } from './mount.decorator';
import Mock = jest.Mock;

describe('automount/mount.decorator', () => {

  let mockWindow: ObjectMock<Window>;
  let mockDocument: ObjectMock<Document>;
  let mockObserver: ObjectMock<MutationObserver>;
  let mockRoot: {
    querySelectorAll: Mock<any[], [string]>;
    addEventListener: Mock;
  };
  let mockAdapter: ElementAdapter;

  beforeEach(() => {
    mockObserver = {
      observe: jest.fn(),
    } as any;
    mockDocument = {
      readyState: 'interactive',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any;
    mockWindow = {
      MutationObserver: jest.fn(() => mockObserver),
      document: mockDocument,
    } as any;
    mockRoot = {
      querySelectorAll: jest.fn(_selector => []),
      addEventListener: jest.fn(),
    };
    mockAdapter = jest.fn();
  });

  let componentType: ComponentClass;

  beforeEach(() => {

    @Component({
      extend: {
        type: MockElement
      }
    })
    @Mount('test-component')
    class TestComponent {
    }

    componentType = TestComponent;
  });

  describe('@Mount', () => {
    it('mounts to matching element', () => {

      const element = {
        name: 'element',
        matches: jest.fn(() => true),
        dispatchEvent: jest.fn(),
      };

      mockRoot.querySelectorAll.mockImplementation(() => [element]);

      bootstrap(componentType);

      const context = ComponentContext.of(element);

      expect(context.componentType).toBe(componentType);
      expect(context.mount).toBeDefined();
    });
    it('mounts to element matching by custom predicate', () => {

      @Component({
        extend: {
          type: MockElement
        }
      })
      @Mount({
        to: () => true,
      })
      class TestComponent {
      }

      const element = {
        name: 'element',
        dispatchEvent: jest.fn(),
      };

      mockRoot.querySelectorAll.mockImplementation(() => [element]);

      bootstrap(TestComponent);

      const context = ComponentContext.of(element);

      expect(context.componentType).toBe(TestComponent);
      expect(context.mount).toBeDefined();
    });
    it('does not mount to non-matching element', () => {

      const element: any = {
        name: 'element',
        matches: jest.fn(() => false),
      };

      mockRoot.querySelectorAll.mockImplementation(() => [element]);

      bootstrap(componentType);

      expect(element[ComponentContext__symbol]).toBeUndefined();
    });
  });

  function bootstrap(...features: Class[]) {

    @Feature({
      set: [
        { a: BootstrapWindow, is: mockWindow },
        { a: BootstrapRoot, is: mockRoot },
        { a: ElementAdapter, is: mockAdapter }
      ],
    })
    class TestFeature {
    }

    return bootstrapComponents(TestFeature, ...features);
  }
});
