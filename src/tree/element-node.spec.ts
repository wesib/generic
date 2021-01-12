import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { QualifiedName } from '@frontmeans/namespace-aliaser';
import { ValueTracker } from '@proc7ts/fun-events';
import { noop, valueProvider } from '@proc7ts/primitives';
import { itsFirst } from '@proc7ts/push-iterator';
import {
  Component,
  ComponentClass,
  ComponentContext,
  ComponentContext__symbol,
  ComponentContextHolder,
  DomProperty,
} from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '../spec/test-element';
import { ComponentNode, ElementNode } from './element-node';

describe('tree', () => {

  let MockMutationObserver: Mock<MutationObserver>;
  let observer: Mocked<MutationObserver>;
  let mutate: (records: Partial<MutationRecord>[]) => void = noop;

  beforeEach(() => {
    MockMutationObserver = jest.fn();
    (window as any).MutationObserver = MockMutationObserver;

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

  interface ComponentNodeInfo {
    readonly element: Element;
    readonly context: ComponentContext;
    readonly node: ComponentNode;
    readonly parent: ElementNode | null;
  }

  async function newComponentNode(
      name = 'div',
      componentName: QualifiedName | null = name,
  ): Promise<ComponentNodeInfo> {

    @Component({
      name: componentName || undefined,
      extend: {
        type: MockElement,
      },
    })
    class TestComponent {
    }

    const Element = await testElement(TestComponent);
    const realElement = new Element();

    const context = ComponentContext.of(realElement);
    const element: Element & ComponentContextHolder = document.createElement(name);

    element[ComponentContext__symbol] = valueProvider(context);
    jest.spyOn(context, 'contentRoot', 'get').mockReturnValue(element);
    (context as any).element = element;

    const node = context.get(ComponentNode);

    return {
      element,
      context,
      node,
      get parent() {
        return node.parent;
      },
    };
  }

  describe('ElementNode', () => {

    let node: ComponentNodeInfo;

    beforeEach(async () => {
      node = await newComponentNode();
    });

    describe('parent', () => {
      it('is `null` by default', () => {
        expect(node.parent).toBeNull();
      });
      it('is detected when added to document', async () => {

        const parent = await newComponentNode();

        parent.element.appendChild(node.element);

        expect(node.parent).toMatchObject({
          context: parent.context,
        });
      });
    });

    describe.each<[string, (TestComponent: ComponentClass) => Promise<{
      element: any;
      elementNode: ElementNode;
      property: ValueTracker<string>;
    }>]>([
      [
        'custom element property',
        async (componentType: ComponentClass) => {

          const element = new (await testElement(componentType))();
          const elementNode = ComponentContext.of(element).get(ComponentNode);
          const property = elementNode.property<string>('property');

          return {
            element,
            elementNode,
            property,
          };
        },
      ],
      [
        'mounted element property',
        async (componentType: ComponentClass) => {

          const root = await newComponentNode('root-component');

          document.body.appendChild(root.element);

          const element = document.createElement('test-component');

          root.element.appendChild(element);

          const elementNode = itsFirst(root.node.select('test-component', { all: true }))!;
          const property = elementNode.property<string>('property');
          const defContext = await testDefinition(componentType);

          const mount = defContext.mountTo(element);

          expect(mount.context.element).toBe(element);
          expect(mount.context.get(ComponentNode)).toBe(elementNode);
          expect(elementNode.property('property')).toBe(property);

          return {
            element,
            elementNode,
            property,
          };
        },
      ],
    ])(
        '%s',
        (_name, init) => {

          let element: any;
          let elementNode: ElementNode;
          let property: ValueTracker<string>;

          beforeEach(async () => {

            @Component({
              name: 'test-component',
              extend: {
                type: MockElement,
              },
            })
            class TestComponent {

              @DomProperty()
              property = 'value';

            }

            const result = await init(TestComponent);

            element = result.element;
            elementNode = result.elementNode;
            property = result.property;
          });

          it('returns the same tracker instance', () => {
            expect(elementNode.property('property')).toBe(property);
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
          it('sends property updates', () => {

            const newValue = 'new value';
            const onUpdate = jest.fn();

            property.on(onUpdate);

            element.property = newValue;
            expect(onUpdate).toHaveBeenCalledWith(newValue, 'value');
          });
          describe('done', () => {
            it('stops sending property updates', () => {

              const newValue = 'new value';
              const onUpdate = jest.fn();

              property.on(onUpdate);

              property.supply.off();
              element.property = newValue;
              expect(onUpdate).not.toHaveBeenCalledWith(newValue, expect.anything());
            });
          });
        },
    );

    describe('attribute', () => {

      let element: any;
      let compNode: ComponentNode;
      let attribute: ValueTracker<string | null>;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: {
            type: MockElement,
          },
        })
        class TestComponent {}

        element = new (await testElement(TestComponent))();
        compNode = ComponentContext.of(element).get(ComponentNode);
        attribute = compNode.attribute('attr');
      });

      function setAttribute(name: string, value: string, oldValue: string | null): void {
        element.setAttribute(name, value);
        mutate([{ type: 'attributes', oldValue, attributeName: name }]);
      }

      it('returns the same tracker instance', () => {
        expect(compNode.attribute('attr')).toBe(attribute);
      });
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
      it('removes attribute value', () => {
        attribute.it = null;

        expect(attribute.it).toBeNull();
        expect(element.hasAttribute('attr')).toBe(false);
      });
      it('does not observe attributes mutations initially', () => {
        expect(observer.observe).not.toHaveBeenCalled();
      });
      it('sends attribute updates', () => {

        const oldValue = 'old value';
        const newValue = 'new value';
        const onUpdate = jest.fn();

        attribute.on(onUpdate);

        setAttribute('attr', newValue, oldValue);
        expect(onUpdate).toHaveBeenCalledWith(newValue, oldValue);
      });
      it('does not send another attribute updates', () => {

        const oldValue = 'old value';
        const newValue = 'new value';
        const onUpdate = jest.fn();

        attribute.on(onUpdate);

        setAttribute('other-attr', newValue, oldValue);
        expect(onUpdate).not.toHaveBeenCalled();
      });
      it('handles multiple receivers of the same attribute updates', () => {

        const value0 = 'old value';
        const value1 = 'new value';
        const value2 = 'value 2';
        const onUpdate1 = jest.fn();
        const onUpdate2 = jest.fn();

        const supply1 = attribute.on(onUpdate1);
        const supply2 = attribute.on(onUpdate2);

        observer.disconnect.mockClear();

        setAttribute('attr', value1, value0);
        expect(onUpdate1).toHaveBeenCalledWith(value1, value0);
        expect(onUpdate2).toHaveBeenCalledWith(value1, value0);

        onUpdate1.mockClear();
        onUpdate2.mockClear();

        supply1.off();
        expect(observer.disconnect).not.toHaveBeenCalled();

        setAttribute('attr', value2, value1);
        expect(onUpdate1).not.toHaveBeenCalled();
        expect(onUpdate2).toHaveBeenCalledWith(value2, value1);

        supply2.off();
        expect(observer.disconnect).toHaveBeenCalled();
      });
      it('handles multiple attributes receivers', () => {

        const attribute2 = compNode.attribute('attr2');

        const value0 = 'old value';
        const value1 = 'new value';
        const value2 = 'value 2';
        const value3 = 'value 3';
        const onUpdate1 = jest.fn();
        const onUpdate2 = jest.fn();

        const supply1 = attribute.on(onUpdate1);
        const supply2 = attribute2.on(onUpdate2);

        expect(observer.observe).toHaveBeenCalledWith(
            element,
            expect.objectContaining({ attributeFilter: ['attr', 'attr2'] }),
        );
        observer.disconnect.mockClear();
        observer.takeRecords.mockClear();
        observer.observe.mockClear();

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

        supply1.off();
        expect(observer.disconnect).toHaveBeenCalled();
        expect(observer.takeRecords).toHaveBeenCalled();
        expect(observer.observe).toHaveBeenCalledWith(
            element,
            expect.objectContaining({ attributeFilter: ['attr2'] }),
        );
        observer.disconnect.mockClear();
        observer.takeRecords.mockClear();
        observer.observe.mockClear();

        setAttribute('attr2', value3, value2);
        expect(onUpdate1).not.toHaveBeenCalled();
        expect(onUpdate2).toHaveBeenCalledWith(value3, value2);

        supply2.off();
        expect(observer.disconnect).toHaveBeenCalled();
        expect(observer.takeRecords).not.toHaveBeenCalled();
        expect(observer.observe).not.toHaveBeenCalled();
      });
      describe('done', () => {
        it('stops sending attribute updates', () => {

          const oldValue = 'old value';
          const newValue = 'new value';
          const onUpdate = jest.fn();

          attribute.on(onUpdate);
          attribute.supply.off();
          setAttribute('attr', newValue, oldValue);
          expect(onUpdate).not.toHaveBeenCalledWith(newValue, oldValue);
        });
      });
    });
  });
});
