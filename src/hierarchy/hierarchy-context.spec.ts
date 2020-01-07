import {
  bootstrapComponents,
  BootstrapContext,
  BootstrapRoot,
  Component,
  ComponentFactory,
  Feature,
} from '@wesib/wesib';
import { EventSupply } from 'fun-events';
import { HierarchyContext } from './hierarchy-context';

describe('hierarchy', () => {
  describe('HierarchyContext', () => {

    let rootElement: Element;
    let containerElement: Element;
    let testElement: Element;
    let nestedElement: Element;

    beforeEach(() => {
      rootElement = document.body.appendChild(document.createElement('test-element'));
      testElement = rootElement.appendChild(document.createElement('test-element'));
      containerElement = testElement.appendChild(document.createElement('container-element'));
      nestedElement = containerElement.appendChild(document.createElement('nested-element'));
    });
    afterEach(() => {
      rootElement.remove();
    });

    let factory: ComponentFactory;
    let testContext: HierarchyContext;
    let nestedContext: HierarchyContext;

    beforeEach(async () => {

      @Component()
      class TestComponent {
      }

      @Feature({
        needs: TestComponent,
        setup(setup) {
          setup.provide({ a: BootstrapRoot, is: rootElement });
        },
      })
      class TestFeature {
      }

      const bsContext = await new Promise<BootstrapContext>(
          resolve => bootstrapComponents(TestFeature).whenReady(resolve),
      );

      factory = await bsContext.whenDefined(TestComponent);
      testContext = factory.mountTo(testElement).context.get(HierarchyContext);
      nestedContext = factory.mountTo(nestedElement).context.get(HierarchyContext);
    });

    describe('up', () => {

      let parent: HierarchyContext | undefined;
      let parentSupply: EventSupply;

      beforeEach(() => {
        parentSupply = nestedContext.up(upper => parent = upper);
      });

      it('resolves to parent component', () => {
        expect(parent).toBe(testContext);
      });
      it('resolves to `undefined` for topmost component', () => {
        testContext.up.once(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for root element', () => {

        const rootContext = factory.mountTo(rootElement).context.get(HierarchyContext);

        rootContext.up.once(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` after component disconnection', async () => {
        nestedContext.context.mount!.connected = false;
        expect(parent).toBeDefined();
        await Promise.resolve();
        expect(parent).toBeUndefined();
      });
      it('resolves to parent after component reconnection', async () => {
        nestedContext.context.mount!.connected = false;
        expect(parent).toBe(testContext);
        await Promise.resolve();
        expect(parent).toBeUndefined();
        nestedContext.context.mount!.connected = true;
        expect(parent).toBe(testContext);
      });
      it('resolves to `undefined` for initially disconnected component', () => {

        const element = document.createElement('disconnected-element');
        const context = factory.mountTo(element).context.get(HierarchyContext);

        context.up.once(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for component without parent', () => {

        const element = document.createElement('disconnected-element');
        const mount = factory.mountTo(element);
        const context = mount.context.get(HierarchyContext);

        mount.connected = true;

        context.up.once(upper => expect(upper).toBeUndefined());
      });
      it('updates on intermediate component mount', () => {

        const context = factory.mountTo(containerElement).context.get(HierarchyContext);

        expect(parent).toBe(context);
      });
      it('updates on intermediate component mount event though there is no receivers', () => {
        parentSupply.off();

        const context = factory.mountTo(containerElement).context.get(HierarchyContext);

        nestedContext.up.once(upper => expect(upper).toBe(context));
      });
    });
  });
});
