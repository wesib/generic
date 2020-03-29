import { MultiContextUpKey, MultiContextUpRef } from '@proc7ts/context-values/updatable';
import { EventSupply, eventSupplyOf } from '@proc7ts/fun-events';
import { bootstrapComponents, BootstrapRoot, Component, DefinitionContext, Feature } from '@wesib/wesib';
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

    let defContext: DefinitionContext;
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

      const bsContext = await bootstrapComponents(TestFeature).whenReady();

      defContext = await bsContext.whenDefined(TestComponent);
      nestedContext = defContext.mountTo(nestedElement).context.get(HierarchyContext);
      testContext = defContext.mountTo(testElement).context.get(HierarchyContext);
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
        testContext.up().once(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for root element', () => {

        const rootContext = defContext.mountTo(rootElement).context.get(HierarchyContext);

        rootContext.up().once(upper => expect(upper).toBeUndefined());
      });
      it('is destroyed after component disconnection', () => {

        const reason = 'test';

        nestedContext.context.destroy(reason);

        const whenOff = jest.fn();

        eventSupplyOf(nestedContext).whenOff(whenOff);
        expect(whenOff).toHaveBeenCalledWith(reason);
      });
      it('resolves to `undefined` for initially disconnected component', () => {

        const element = document.createElement('disconnected-element');
        const context = defContext.mountTo(element).context.get(HierarchyContext);

        context.up().once(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for component without parent', () => {

        const element = document.createElement('disconnected-element');
        const mount = defContext.mountTo(element);
        const context = mount.context.get(HierarchyContext);

        mount.connect();

        context.up().once(upper => expect(upper).toBeUndefined());
      });
      it('updates on intermediate component mount', () => {
        defContext.mountTo(containerElement);

        expect(parent?.context.element.tagName).toBe(containerElement.tagName);
      });
      it('updates on intermediate component mount event though there is no receivers', () => {
        parentSupply.off();

        const context = defContext.mountTo(containerElement).context.get(HierarchyContext);

        nestedContext.up().once(upper => expect(upper).toBe(context));
      });
    });

    describe('provide', () => {

      let key: MultiContextUpRef<string>;

      beforeEach(() => {
        key = new MultiContextUpKey<string>('test');
      });

      it('makes value available in context', () => {
        nestedContext.provide({ a: key, is: 'foo' });
        nestedContext.get(key).once(value => expect(value).toBe('foo'));
      });
      it('makes value available in nested context', () => {

        const remove = testContext.provide({ a: key, is: 'foo' });

        nestedContext.provide({ a: key, is: 'bar' });
        nestedContext.get(key).once((...values) => expect(values).toEqual(['foo', 'bar']));

        remove();
        nestedContext.get(key).once((...values) => expect(values).toEqual(['bar']));

        testContext.provide({ a: key, is: 'baz' });
        nestedContext.get(key).once((...values) => expect(values).toEqual(['baz', 'bar']));
      });
      it('makes all parent values available in nested context', () => {
        testContext.provide({ a: key, is: 'foo' });
        nestedContext.provide({ a: key, is: 'bar' });

        const context = defContext.mountTo(containerElement).context.get(HierarchyContext);

        context.provide({ a: key, is: 'baz' });
        nestedContext.get(key).once((...values) => expect(values).toEqual(['foo', 'baz', 'bar']));
      });
      it('makes disconnected component value unavailable in nested context', () => {
        testContext.provide({ a: key, is: 'foo' });
        nestedContext.provide({ a: key, is: 'bar' });
        nestedContext.context.destroy();
        nestedContext.get(key).once((...values) => expect(values).toEqual(['bar']));
      });
    });
  });
});
