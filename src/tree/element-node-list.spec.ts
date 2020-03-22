import { AIterable, ArrayLikeIterable, itsEmpty } from '@proc7ts/a-iterable';
import { noop } from '@proc7ts/call-thru';
import { afterSupplied, onSupplied } from '@proc7ts/fun-events';
import {
  bootstrapComponents,
  BootstrapContext,
  Component,
  ComponentClass,
  ComponentFactory,
  CustomElements,
  ElementObserver,
  Feature,
} from '@wesib/wesib';
import { ComponentTreeSupport } from './component-tree-support.feature';
import { ComponentNode, ElementNode } from './element-node';
import { ElementNodeList } from './element-node-list';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

describe('tree', () => {
  describe('ElementNodeList', () => {

    let rootElement: Element;

    beforeEach(() => {
      rootElement = document.createElement('test-root');
      document.body.appendChild(rootElement);
    });
    afterEach(() => {
      rootElement.remove();
    });

    let rootNode: ComponentNode;
    let bsContext: BootstrapContext;

    beforeEach(async () => {

      const factory = await new Promise<ComponentFactory>(resolve => {
        @Component({
          feature: {
            needs: ComponentTreeSupport,
            setup(setup) {
              setup.provide({
                a: CustomElements,
                is: {
                  define() {/* do not define */},
                  whenDefined() {
                    return Promise.resolve();
                  },
                },
              });
            },
            init(context) {
              context.whenReady(() => {
                context.whenDefined(TestRootComponent).then(resolve);
              });
            },
          },
        })
        class TestRootComponent {
        }

        bsContext = bootstrapComponents(TestRootComponent);
      });

      rootNode = factory.mountTo(rootElement).context.get(ComponentNode);
    });

    describe('[OnEvent__symbol]', () => {
      it('is an alias of `onUpdate`', () => {

        const list = rootNode.select('*', { all: true });

        expect(onSupplied(list)).toBe(list.onUpdate());
      });
    });
    describe('[AfterEvent__symbol]', () => {
      it('is an alias of `read`', () => {

        const list = rootNode.select('*', { all: true });

        expect(afterSupplied(list)).toBe(list.read());
      });
    });

    describe('element selection', () => {

      let e1: Element;
      let e2: Element;
      let e21: Element;

      beforeEach(() => {
        e1 = document.createElement('div');
        e1.setAttribute('id', '1');
        e2 = document.createElement('span');
        e2.setAttribute('id', '2');
        e21 = document.createElement('strong');
        e21.setAttribute('id', '2.1');

        e2.append(e21);
        rootElement.append(e1, e2);
      });

      it('contains child elements', () => {
        expect(elementsOf(rootNode.select('*', { all: true }))).toEqual([e1, e2]);
      });
      it('contains subtree with `deep` option', () => {
        expect(elementsOf(rootNode.select('*', { all: true, deep: true }))).toEqual([e1, e2, e21]);
      });

      describe('track', () => {
        it('sends current node list upon receiver registration', () => {

          const list = rootNode.select('*', { all: true });
          let added1!: Element[];
          let removed1!: Element[];

          list.track((a, r) => {
            added1 = elementsOf(a);
            removed1 = elementsOf(r);
          });

          expect(added1).toEqual([e1, e2]);
          expect(removed1).toHaveLength(0);

          let added2!: Element[];
          let removed2!: Element[];

          list.track((a, r) => {
            added2 = elementsOf(a);
            removed2 = elementsOf(r);
          });

          expect(added2).toEqual(added1);
          expect(removed2).toEqual(removed1);
        });
        it('sends updates', async () => {

          const list = rootNode.select('*', { all: true });
          let lastAdded!: Element[];
          let lastRemoved!: Element[];

          list.track((a, r) => {
            lastAdded = elementsOf(a);
            lastRemoved = elementsOf(r);
          });

          const added = document.createElement('added-component');

          rootElement.appendChild(added);
          e1.remove();
          await Promise.resolve();

          expect(lastAdded).toEqual([added]);
          expect(lastRemoved).toEqual([e1]);
        });
      });

      describe('read', () => {
        it('reports updated node list', async () => {

          const list = rootNode.select('*', { all: true });
          const receiver = jest.fn();

          list.read(receiver);
          expect(receiver).toHaveBeenCalledWith(list);

          const added = document.createElement('added-component');

          rootElement.appendChild(added);
          e1.remove();
          await Promise.resolve();

          expect(receiver).toHaveBeenCalledTimes(2);
        });
      });

      describe('shallow onUpdate', () => {

        let e3: Element;
        let list: ElementNodeList;
        let onUpdateMock: Mock<void, [ElementNode[], ElementNode[]]>;
        let added: Element[];
        let removed: Element[];

        beforeEach(() => {
          e3 = rootElement.appendChild(document.createElement('div'));
          e3.setAttribute('id', '3');
          list = rootNode.select('div', { all: true });
          elementsOf(list); // Read first to bind nodes
          onUpdateMock = jest.fn((a, r) => {
            added = elementsOf(a);
            removed = elementsOf(r);
          });
          list.onUpdate(onUpdateMock);
        });

        it('handles child addition', async () => {

          const e4 = rootElement.appendChild(document.createElement('div'));

          e4.setAttribute('id', '4');
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3, e4]);
          expect(onUpdateMock).toHaveBeenCalled();
          expect(added).toEqual([e4]);
        });
        it('ignores irrelevant child addition', async () => {

          const e4 = rootElement.appendChild(document.createElement('span'));

          e4.setAttribute('id', '4');
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3]);
          expect(onUpdateMock).not.toHaveBeenCalled();
        });
        it('ignores nested child addition', async () => {

          const span = document.createElement('span');
          const e4 = span.appendChild(document.createElement('div'));

          e4.setAttribute('id', '4');
          rootElement.appendChild(span);
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3]);
          expect(onUpdateMock).not.toHaveBeenCalled();
        });
        it('ignores non-element child node addition', async () => {
          rootElement.appendChild(document.createTextNode('text'));
          await Promise.resolve();
          expect(elementsOf(list)).toEqual([e1, e3]);
          expect(onUpdateMock).not.toHaveBeenCalled();
        });
        it('handles child removal', async () => {
          e3.remove();
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1]);
          expect(onUpdateMock).toHaveBeenCalled();
          expect(removed).toEqual([e3]);
        });
        it('ignores irrelevant child removal', async () => {
          e2.remove();
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3]);
          expect(onUpdateMock).not.toHaveBeenCalled();
        });
        it('ignores non-element child node removal', async () => {

          const text = rootElement.appendChild(document.createTextNode('text'));

          await Promise.resolve();

          text.remove();
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3]);
          expect(onUpdateMock).not.toHaveBeenCalled();
        });
      });

      describe('deep onUpdate', () => {

        let e3: Element;
        let list: ElementNodeList;
        let onUpdateMock: Mock<void, [ElementNode[], ElementNode[]]>;
        let added: Element[];
        let removed: Element[];

        beforeEach(() => {
          e3 = e2.appendChild(document.createElement('div'));
          e3.setAttribute('id', '3');
          list = rootNode.select('div', { all: true, deep: true });
          elementsOf(list); // Read first to bind nodes
          onUpdateMock = jest.fn((a, r) => {
            added = elementsOf(a);
            removed = elementsOf(r);
          });
          list.onUpdate(onUpdateMock);
        });

        it('handles nested child addition', async () => {

          const span = document.createElement('span');
          const e4 = span.appendChild(document.createElement('div'));

          e4.setAttribute('id', '4');

          rootElement.appendChild(span);
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1, e3, e4]);
          expect(onUpdateMock).toHaveBeenCalled();
          expect(added).toEqual([e4]);
        });
        it('handles nested child removal', async () => {
          e3.remove();
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1]);
          expect(onUpdateMock).toHaveBeenCalled();
          expect(removed).toEqual([e3]);
        });
        it('handles subtree removal', async () => {
          e2.remove();
          await Promise.resolve();

          expect(elementsOf(list)).toEqual([e1]);
          expect(onUpdateMock).toHaveBeenCalled();
          expect(removed).toEqual([e3]);
        });
      });

      describe('first', () => {

        let list: ElementNodeList;
        let firstNode: ElementNode | undefined;

        beforeEach(() => {
          firstNode = undefined;
          list = rootNode.select('*', { all: true });
          list.first(n => firstNode = n);
        });

        it('refers to the first node', () => {
          expect(firstNode?.element).toBe(e1);
        });
        it('is cached', () => {
          expect(list.first).toBe(list.first);
        });
      });

      describe('selected node', () => {

        let nodes: ElementNode[];

        beforeEach(() => {
          nodes = [...rootNode.select('*', { all: true, deep: true })];
        });

        describe('parent', () => {
          it('refers to parent node', () => {
            expect(nodes[0].parent).toBe(rootNode);
            expect(nodes[1].parent).toBe(rootNode);
            expect(nodes[2].parent).toBe(nodes[1]);
          });
          it('becomes `null` when element node removed from DOM tree', () => {
            e21.remove();
            expect(nodes[2].parent).toBeNull();
          });
        });
        describe('attribute', () => {
          it('reflects attribute', () => {
            e21.setAttribute('attr', 'value');
            expect(nodes[2].attribute('attr').it).toBe('value');
          });
        });
      });

      describe('element observing', () => {

        let elementObserver: ElementObserver;
        let observeSpy: SpyInstance;
        let disconnectSpy: SpyInstance;
        let list: ElementNodeList;

        beforeEach(async () => {

          const newElementObserver = bootstrapComponents().get(ElementObserver);

          @Feature({
            setup(setup) {
              setup.provide({
                a: ElementObserver,
                is: callback => {
                  elementObserver = newElementObserver(callback);
                  observeSpy = jest.spyOn(elementObserver, 'observe');
                  disconnectSpy = jest.spyOn(elementObserver, 'disconnect');
                  return elementObserver;
                },
              });
            },
          })
          class ObservingTestFeature {
          }

          await new Promise(resolve => bsContext.load(ObservingTestFeature).read(({ ready }) => ready && resolve()));

          list = rootNode.select('*', { all: true });
        });

        it('does not observe DOM mutations initially', () => {
          list.onUpdate();
          expect(observeSpy).not.toHaveBeenCalled();
        });
        it('observes DOM mutations', () => {
          list.onUpdate(noop);
          expect(observeSpy).toHaveBeenCalled();
        });
        it('disconnects when no more listeners', () => {

          const supply1 = list.onUpdate(noop);
          const supply2 = list.onUpdate(noop);

          expect(observeSpy).toHaveBeenCalledTimes(1);

          supply1.off();
          expect(disconnectSpy).not.toHaveBeenCalled();

          supply2.off();
          expect(disconnectSpy).toHaveBeenCalled();
        });
      });
    });

    describe('component selection', () => {

      let e1: Element;
      let e2: Element;
      let e3: Element;

      beforeEach(() => {
        e1 = document.createElement('test-component');
        e1.setAttribute('id', '1');
        e2 = document.createElement('other-component');
        e2.setAttribute('id', '2');
        e3 = document.createElement('test-component');
        e3.setAttribute('id', '3');

        rootElement.append(e1, e2, e3);
      });

      let factory1: ComponentFactory;
      let factory2: ComponentFactory;
      let n1: ComponentNode;
      let n3: ComponentNode;

      beforeEach(async () => {
        @Component('test-component')
        class Component1 {
        }

        @Component({
          name: 'other-component',
          feature: {
            needs: Component1,
          },
        })
        class Component2 {
        }

        await new Promise(resolve => bsContext.load(Component2).read(({ ready }) => ready && resolve()));

        factory1 = await bsContext.whenDefined(Component1);
        factory2 = await bsContext.whenDefined(Component2);

        n1 = factory1.mountTo(e1).context.get(ComponentNode);
        factory2.mountTo(e2).context.get(ComponentNode);
        n3 = factory1.mountTo(e3).context.get(ComponentNode);
      });

      describe('by selector', () => {

        let list: ElementNodeList<ComponentNode>;

        beforeEach(() => {
          list = rootNode.select('test-component');
        });

        it('contains matching components', () => {
          expect([...list]).toEqual([n1, n3]);
        });

        describe('onUpdate', () => {

          let onUpdateMock: Mock<void, [ComponentNode[], ComponentNode[]]>;

          beforeEach(() => {
            onUpdateMock = jest.fn();
            list.onUpdate(onUpdateMock);
          });

          it('handles child component addition', async () => {

            const e4 = document.createElement('test-component');

            e4.setAttribute('id', '4');

            const n4 = factory1.mountTo(e4).context.get(ComponentNode);

            rootElement.appendChild(e4);
            await Promise.resolve();

            expect([...list]).toEqual([n1, n3, n4]);
            expect(onUpdateMock).toHaveBeenCalledWith([n4], []);
          });
          it('ignores non-component child element addition', async () => {

            const e4 = document.createElement('test-component');

            e4.setAttribute('id', '4');
            rootElement.appendChild(e4);
            await Promise.resolve();

            expect([...list]).toEqual([n1, n3]);
            expect(onUpdateMock).not.toHaveBeenCalled();
          });
          it('handles child component mount', async () => {

            const e4 = document.createElement('test-component');

            e4.setAttribute('id', '4');

            rootElement.appendChild(e4);
            await Promise.resolve();

            const n4 = factory1.mountTo(e4).context.get(ComponentNode);

            expect([...list]).toEqual([n1, n3, n4]);
            expect(onUpdateMock).toHaveBeenCalledWith([n4], []);
          });
          it('ignores irrelevant child component mount', async () => {

            const e4 = document.createElement('other-component');

            e4.setAttribute('id', '4');

            rootElement.appendChild(e4);
            await Promise.resolve();

            factory2.mountTo(e4).context.get(ComponentNode);

            expect([...list]).toEqual([n1, n3]);
            expect(onUpdateMock).not.toHaveBeenCalled();
          });
        });
      });

      describe('by component type', () => {

        let e4: Element;

        beforeEach(async () => {
          e4 = document.createElement('component-3');
          e4.setAttribute('id', '4');
          rootElement.appendChild(e4);
          await Promise.resolve();
        });

        let cType: ComponentClass;

        beforeEach(async () => {
          @Component('component-3')
          class Component3 {}

          cType = Component3;

          await new Promise(resolve => bsContext.load(Component3).read(({ ready }) => ready && resolve()));
        });

        let factory4: ComponentFactory;
        let n4: ComponentNode;

        beforeEach(async () => {
          factory4 = await bsContext.whenDefined(cType);
          n4 = factory4.mountTo(e4).context.get(ComponentNode);
        });

        it('updates the list when component is defined', async () => {

          const list = rootNode.select(cType);

          expect([...list]).toHaveLength(0);
          await bsContext.whenDefined(cType);
          expect([...list]).toEqual([n4]);
        });
        it('reports update when component is defined', async () => {

          const onUpdate = jest.fn();
          const list = rootNode.select(cType);

          list.onUpdate(onUpdate);

          await bsContext.whenDefined(cType);

          expect([...list]).toEqual([n4]);
          expect(onUpdate).toHaveBeenCalledWith([n4], []);
        });
        it('does not report update when no elements match', async () => {
          e4.remove();
          await Promise.resolve();

          const onUpdate = jest.fn();
          const list = rootNode.select(cType);

          list.onUpdate(onUpdate);

          await bsContext.whenDefined(cType);

          expect(itsEmpty(list)).toBe(true);
          expect(onUpdate).not.toHaveBeenCalled();
        });
        it('does not report update of non-component node', async () => {
          e4.remove();

          const e5 = rootElement.appendChild(document.createElement('component-3'));

          e5.setAttribute('id', '5');

          await Promise.resolve();

          const onUpdate = jest.fn();
          const list = rootNode.select(cType);

          list.onUpdate(onUpdate);

          await bsContext.whenDefined(cType);

          expect(itsEmpty(list)).toBe(true);
          expect(onUpdate).not.toHaveBeenCalled();
        });
        it('reports nothing for anonymous component', async () => {

          @Component({})
          class Component4 {}

          await new Promise(resolve => bsContext.load(Component4).read(({ ready }) => ready && resolve()));

          const onUpdate = jest.fn();
          const list = rootNode.select(Component4);

          list.onUpdate(onUpdate);

          await bsContext.whenDefined(Component4);

          expect(itsEmpty(list)).toBe(true);
          expect(onUpdate).not.toHaveBeenCalled();
        });
      });
    });

    function elementsOf(nodes: ArrayLikeIterable<ElementNode> | ElementNode[]): Element[] {
      return [...AIterable.of(nodes).map(node => node.element)];
    }
  });
});
