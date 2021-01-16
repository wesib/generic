import { Class } from '@proc7ts/primitives';
import {
  bootstrapComponents,
  BootstrapRoot,
  Component,
  ComponentClass,
  ComponentElement,
  ComponentSlot,
  ComponentSlot__symbol,
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
    it('mounts to named element', async () => {

      const element: ComponentElement = document.createElement('test-component');

      root.appendChild(element);

      await bootstrap(componentType);

      const context = await ComponentSlot.of(element).whenReady;

      expect(context.componentType).toBe(componentType);
      expect(context.mount).toBeDefined();
    });
    it('mounts to matching element', async () => {

      @Component({
        extend: {
          type: MockElement,
        },
      })
      @Mount({
        to: 'test-element',
      })
      class TestComponent {
      }

      const element: ComponentElement = document.createElement('test-element');

      root.appendChild(element);

      await bootstrap(TestComponent);

      const context = await ComponentSlot.of(element).whenReady;

      expect(context.componentType).toBe(TestComponent);
      expect(context.mount).toBeDefined();
    });
    it('mounts to element matching the custom predicate', async () => {

      @Component({
        extend: {
          type: MockElement,
        },
      })
      @Mount({
        to: 'test-element',
        when: () => true,
      })
      class TestComponent {
      }

      const element: ComponentElement = document.createElement('test-element');

      root.appendChild(element);

      await bootstrap(TestComponent);

      const context = await ComponentSlot.of(element).whenReady;

      expect(context.componentType).toBe(TestComponent);
      expect(context.mount).toBeDefined();
    });
    it('does not mount to non-matching element', async () => {

      const element: ComponentElement = document.createElement('wrong-element');

      root.appendChild(element);
      await bootstrap(componentType);

      expect(element[ComponentSlot__symbol]).toBeUndefined();
    });
    it('does not mount to element not matching the custom predicate', async () => {

      @Component({
        extend: {
          type: MockElement,
        },
      })
      @Mount({
        to: 'test-element',
        when: () => false,
      })
      class TestComponent {
      }

      const element: ComponentElement = document.createElement('test-element');

      root.appendChild(element);

      await bootstrap(TestComponent);

      expect(element[ComponentSlot__symbol]).toBeUndefined();
    });
  });

  async function bootstrap(...features: Class[]): Promise<void> {

    @Feature({
      setup(setup) {
        setup.provide({ a: BootstrapRoot, is: root });
      },
    })
    class TestFeature {
    }

    await bootstrapComponents(TestFeature, ...features).whenReady;
  }
});
