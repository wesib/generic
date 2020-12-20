import { Class } from '@proc7ts/primitives';
import {
  bootstrapComponents,
  BootstrapRoot,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentContext__symbol,
  ElementAdapter,
  Feature,
} from '@wesib/wesib';
import { MockElement } from '../spec/test-element';
import { Mount } from './mount.decorator';

describe('automount', () => {

  let root: Element;

  beforeEach(() => {
    root = document.createElement('test-root');
    document.body.appendChild(root);
  });
  afterEach(() => {
    root.remove();
  });

  let mockAdapter: ElementAdapter;

  beforeEach(() => {
    mockAdapter = jest.fn();
  });

  let componentType: ComponentClass;

  beforeEach(() => {

    @Component({
      extend: {
        type: MockElement,
      },
    })
    @Mount('test-component')
    class TestComponent {
    }

    componentType = TestComponent;
  });

  describe('@Mount', () => {
    it('mounts to matching element', async () => {

      const element = document.createElement('test-component');

      root.appendChild(element);

      await bootstrap(componentType);

      const context = ComponentContext.of(element);

      expect(context.componentType).toBe(componentType);
      expect(context.mount).toBeDefined();
    });
    it('mounts to element matching by custom predicate', async () => {

      @Component({
        extend: {
          type: MockElement,
        },
      })
      @Mount({
        to: () => true,
      })
      class TestComponent {
      }

      const element = document.createElement('element');

      root.appendChild(element);

      await bootstrap(TestComponent);

      const context = ComponentContext.of(element);

      expect(context.componentType).toBe(TestComponent);
      expect(context.mount).toBeDefined();
    });
    it('does not mount to non-matching element', async () => {

      const element = document.createElement('element');

      root.appendChild(element);
      await bootstrap(componentType);

      expect((element as any)[ComponentContext__symbol]).toBeUndefined();
    });
  });

  async function bootstrap(...features: Class[]): Promise<void> {

    @Feature({
      setup(setup) {
        setup.provide({ a: BootstrapRoot, is: root });
        setup.provide({ a: ElementAdapter, is: mockAdapter });
      },
    })
    class TestFeature {
    }

    await bootstrapComponents(TestFeature, ...features).whenReady;
  }
});
