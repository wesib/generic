import { MultiContextUpKey, MultiContextUpRef } from '@proc7ts/context-values/updatable';
import { onceAfter } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
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
    let testHierarchy: HierarchyContext;
    let nestedHierarchy: HierarchyContext;

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

      const bsContext = await bootstrapComponents(TestFeature).whenReady;

      defContext = await bsContext.whenDefined(TestComponent);
      nestedHierarchy = defContext.mountTo(nestedElement).context.get(HierarchyContext);
      testHierarchy = defContext.mountTo(testElement).context.get(HierarchyContext);
    });

    afterEach(() => {
      Supply.onUnexpectedAbort();
    });

    describe('up', () => {

      let parentHierarchy: HierarchyContext | undefined;
      let parentSupply: Supply;

      beforeEach(() => {
        parentSupply = nestedHierarchy.up(upper => parentHierarchy = upper);
      });

      it('resolves to parent component', () => {
        expect(parentHierarchy).toBe(testHierarchy);
      });
      it('resolves to `undefined` for topmost component', () => {
        testHierarchy.up.do(onceAfter)(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for root element', () => {

        const rootHierarchy = defContext.mountTo(rootElement).context.get(HierarchyContext);

        rootHierarchy.up.do(onceAfter)(upper => expect(upper).toBeUndefined());
      });
      it('is destroyed after component disconnection', () => {
        Supply.onUnexpectedAbort(noop);

        const reason = 'test';

        nestedHierarchy.context.destroy(reason);

        const whenOff = jest.fn();

        nestedHierarchy.supply.whenOff(whenOff);
        expect(whenOff).toHaveBeenCalledWith(reason);
      });
      it('resolves to `undefined` for initially disconnected component', () => {

        const element = document.createElement('disconnected-element');
        const hierarchy = defContext.mountTo(element).context.get(HierarchyContext);

        hierarchy.up.do(onceAfter)(upper => expect(upper).toBeUndefined());
      });
      it('resolves to `undefined` for component without parent', () => {

        const element = document.createElement('disconnected-element');
        const mount = defContext.mountTo(element);
        const hierarchy = mount.context.get(HierarchyContext);

        mount.connect();

        hierarchy.up.do(onceAfter)(upper => expect(upper).toBeUndefined());
      });
      it('resolves to assigned enclosing component for disconnected component', () => {

        const element = document.createElement('disconnected-element');
        const hierarchy = defContext.mountTo(element).context.get(HierarchyContext);

        expect(hierarchy.inside(testHierarchy.context)).toBe(hierarchy);
        hierarchy.up.do(onceAfter)(upper => expect(upper).toBe(testHierarchy));
      });
      it('resolves to `undefined` when enclosing component reset for disconnected component', () => {

        const element = document.createElement('disconnected-element');
        const hierarchy = defContext.mountTo(element).context.get(HierarchyContext);

        expect(hierarchy.inside(testHierarchy.context)).toBe(hierarchy);
        expect(hierarchy.inside()).toBe(hierarchy);
        hierarchy.up.do(onceAfter)(upper => expect(upper).toBeUndefined());
      });
      it('updates to real enclosing component when connected', () => {

        const element = document.createElement('disconnected-element');
        const mount = defContext.mountTo(element);
        const hierarchy = mount.context.get(HierarchyContext);

        expect(hierarchy.inside(testHierarchy.context)).toBe(hierarchy);

        const containerHierarchy = defContext.mountTo(containerElement).context.get(HierarchyContext);

        containerElement.appendChild(element);
        mount.checkConnected();
        hierarchy.up.do(onceAfter)(upper => expect(upper).toBe(containerHierarchy));
      });
      it('updates on intermediate component mount', () => {
        defContext.mountTo(containerElement);

        expect(parentHierarchy?.context.element.tagName).toBe(containerElement.tagName);
      });
      it('updates on intermediate component mount event though there is no receivers', () => {
        parentSupply.off();

        const hierarchy = defContext.mountTo(containerElement).context.get(HierarchyContext);

        nestedHierarchy.up.do(onceAfter)(upper => expect(upper).toBe(hierarchy));
      });
      it('ignores assigned enclosing component when connected', () => {
        defContext.mountTo(containerElement);

        expect(nestedHierarchy.inside(testHierarchy.context)).toBe(nestedHierarchy);
        expect(parentHierarchy?.context.element.tagName).toBe(containerElement.tagName);
      });
    });

    describe('provide', () => {

      let key: MultiContextUpRef<string>;

      beforeEach(() => {
        key = new MultiContextUpKey<string>('test');
      });

      it('makes value available in context', () => {
        nestedHierarchy.provide({ a: key, is: 'foo' });
        nestedHierarchy.get(key).do(onceAfter)(value => expect(value).toBe('foo'));
      });
      it('makes value available in nested context', () => {

        const supply = testHierarchy.provide({ a: key, is: 'foo' });

        nestedHierarchy.provide({ a: key, is: 'bar' });
        nestedHierarchy.get(key).do(onceAfter)((...values) => expect(values).toEqual(['foo', 'bar']));

        supply.off();
        nestedHierarchy.get(key).do(onceAfter)((...values) => expect(values).toEqual(['bar']));

        testHierarchy.provide({ a: key, is: 'baz' });
        nestedHierarchy.get(key).do(onceAfter)((...values) => expect(values).toEqual(['baz', 'bar']));
      });
      it('makes all parent values available in nested context', () => {
        testHierarchy.provide({ a: key, is: 'foo' });
        nestedHierarchy.provide({ a: key, is: 'bar' });

        const hierarchy = defContext.mountTo(containerElement).context.get(HierarchyContext);

        hierarchy.provide({ a: key, is: 'baz' });
        nestedHierarchy.get(key).do(onceAfter)((...values) => expect(values).toEqual(['foo', 'baz', 'bar']));
      });
      it('makes disconnected component value unavailable in nested context', () => {
        testHierarchy.provide({ a: key, is: 'foo' });
        nestedHierarchy.provide({ a: key, is: 'bar' });
        nestedHierarchy.context.destroy();
        nestedHierarchy.get(key).do(onceAfter)((...values) => expect(values).toEqual(['bar']));
      });
    });
  });
});
