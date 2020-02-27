import {
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  DefaultRenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ContextRegistry } from 'context-values';
import { newNamespaceAliaser } from 'namespace-aliaser';
import { immediateRenderScheduler, newManualRenderScheduler, RenderSchedule, RenderScheduler } from 'render-scheduler';
import { produceBasicStyle, StypOptions, StypRenderer, stypRoot, stypSelector, StypSelector } from 'style-producer';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStyleProducer as ComponentStyleProducer_ } from './component-style-producer.impl';
import { ComponentStypOptions } from './component-styp-options';
import { ElementIdClass, ElementIdClass__NS } from './element-id-class.impl';
import Mock = jest.Mock;

describe('styp', () => {
  describe('ComponentStyleProducer', () => {

    let registry: ContextRegistry<ComponentContext>;
    let context: ComponentContext;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      context = {
        get: values.get,
        contentRoot: document.createElement('content-root'),
      } as any;

      registry.provide({ a: ComponentContext, is: context });
    });

    beforeEach(() => {
      registry.provide({
        a: DefaultNamespaceAliaser,
        is: newNamespaceAliaser(),
      });
    });

    let mockRenderScheduler: Mock<RenderSchedule, Parameters<RenderScheduler>>;

    beforeEach(() => {
      mockRenderScheduler = jest.fn(immediateRenderScheduler);
      registry.provide({ a: DefaultRenderScheduler, is: mockRenderScheduler });
    });

    let elementId: ElementIdClass;

    beforeEach(() => {
      elementId = ['test-element-id', ElementIdClass__NS];
      registry.provide({ a: ElementIdClass, is: elementId });
    });

    let mockRenderer: Mock<void, Parameters<StypRenderer.Function>>;
    let renderedSelector: StypSelector.Normalized;

    beforeEach(() => {
      renderedSelector = undefined!;
      mockRenderer = jest.fn((prod, _props) => {
        renderedSelector = prod.selector;
      });
    });

    let producer: ComponentStyleProducer;
    let mockProduceStyle: Mock<ReturnType<typeof produceBasicStyle>, Parameters<typeof produceBasicStyle>>;

    beforeEach(() => {
      mockProduceStyle = jest.fn(produceBasicStyle);
      registry.provide({
        a: ComponentStyleProducer_,
        by(ctx: ComponentContext) {
          return new ComponentStyleProducer_(ctx, mockProduceStyle);
        },
      });
      registry.provide({
        a: ComponentStyleProducer,
        by(prod: ComponentStyleProducer_): ComponentStyleProducer {
          return (rules, opts) => prod.produce(rules, opts);
        },
        with: [ComponentStyleProducer_],
      });

      producer = context.get(ComponentStyleProducer);
    });

    describe('options', () => {
      describe('renderer', () => {
        it('respects explicit value', () => {
          produce();
          expect(mockRenderer).toHaveBeenCalled();
        });
      });

      describe('document', () => {
        // eslint-disable-next-line jest/expect-expect
        it('defaults to bootstrap window document', () => {

          const doc = document.implementation.createHTMLDocument('test');

          registry.provide({ a: BootstrapWindow, is: { document: doc } as BootstrapWindow });

          produce();
          expectOptions({ document: doc });
        });
        // eslint-disable-next-line jest/expect-expect
        it('respects explicit value', () => {

          const doc = document.implementation.createHTMLDocument('test');

          produce({ document: doc });
          expectOptions({ document: doc });
        });
      });

      describe('parent', () => {
        // eslint-disable-next-line jest/expect-expect
        it('defaults to component content root', () => {
          produce();
          expectOptions({ parent: context.contentRoot });
        });
        // eslint-disable-next-line jest/expect-expect
        it('respects explicit value', () => {

          const parent = document.createElement('content-parent');

          produce({ parent });
          expectOptions({ parent });
        });
      });

      describe('rootSelector', () => {
        // eslint-disable-next-line jest/expect-expect
        it('is empty by default', () => {
          produce();
          expectOptions({ rootSelector: [] });
        });
        // eslint-disable-next-line jest/expect-expect
        it('ignores explicit value', () => {
          produce({ rootSelector: 'some' } as StypOptions as ComponentStypOptions);
          expectOptions({ rootSelector: [] });
        });
      });

      describe('schedule', () => {
        it('defaults to render scheduler', () => {
          produce();
          expect(mockProduceStyle).toHaveBeenCalled();

          const scheduler = mockProduceStyle.mock.calls[0][1]!.scheduler!;
          const options = { window, name: 'options' };

          scheduler(options);

          expect(mockRenderScheduler).toHaveBeenLastCalledWith(options);
        });
        // eslint-disable-next-line jest/expect-expect
        it('respects explicit value', () => {

          const scheduler = newManualRenderScheduler();

          produce({ scheduler });
          expectOptions({ scheduler });
        });
      });

      describe('nsAlias', () => {
        // eslint-disable-next-line jest/expect-expect
        it('defaults to default namespace alias', () => {
          produce();
          expectOptions({ nsAlias: context.get(DefaultNamespaceAliaser) });
        });
        // eslint-disable-next-line jest/expect-expect
        it('respects explicit value', () => {

          const nsAlias = newNamespaceAliaser();

          produce({ nsAlias });
          expectOptions({ nsAlias });
        });
      });

      function expectOptions(opts: StypOptions): void {
        expect(mockProduceStyle).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining(opts),
        );
      }

      function produce(opts?: ComponentStypOptions): void {

        const { rules } = stypRoot();

        producer(rules, { ...opts, renderer: mockRenderer });
      }
    });

    describe('selector modification', () => {
      describe('with shadow DOM', () => {
        beforeEach(() => {

          const contentRoot = context.contentRoot as Element;
          const shadowRoot = contentRoot.attachShadow({ mode: 'closed' });

          registry.provide({ a: ShadowContentRoot, is: shadowRoot });
        });

        it('replaces root selector with `:host` by default', () => {
          produce([]);
          expect(renderedSelector).toEqual([{ u: [[':', 'host']] }]);
        });
        it('retains arbitrary selector by default', () => {
          produce([{ e: 'test-element' }]);
          expect(renderedSelector).toEqual([{ e: 'test-element' }]);
        });
        it('retains arbitrary selector when host selector specified', () => {
          produce([{ e: 'test-element' }], { hostSelector: { c: 'host-class' } });
          expect(renderedSelector).toEqual([{ e: 'test-element' }]);
        });
        it('replaces `:host` selector with host one', () => {
          produce([{ u: [':', 'host'] }, { e: 'nested-element' }], { hostSelector: { c: 'host-class' } });
          expect(renderedSelector).toEqual([{ u: [[':', 'host', [{ c: ['host-class'] }]]] }, { e: 'nested-element' }]);
        });
        it('extends `:host(selector)` selector with host one', () => {
          produce(
              [{ u: [':', 'host', { c: 'test-class' }] }, { e: 'nested-element' }],
              { hostSelector: { c: 'host-class' } },
          );
          expect(renderedSelector).toEqual([
            { u: [[':', 'host', [{ c: ['test-class', 'host-class'] }]]] },
            { e: 'nested-element' },
          ]);
        });
      });

      describe('without shadow DOM', () => {
        it('replaces root selector with ID class by default', () => {
          produce([]);
          expect(renderedSelector).toEqual([{ c: [elementId] }]);
        });
        it('replaces root selector with normalized explicit host selector', () => {

          const hostSelector = { e: 'host-element', c: 'some' };

          produce([], { hostSelector });
          expect(renderedSelector).toEqual(stypSelector(hostSelector));
        });
        it('replaces `:host` with host selector', () => {
          produce({ u: [':', 'host'] });
          expect(renderedSelector).toEqual([{ c: [elementId] }]);
        });

        it('assigns element to `:host` selector', () => {
          produce({ u: [':', 'host'] }, { hostSelector: { e: 'host-element' } });
          expect(renderedSelector).toEqual([{ e: 'host-element' }]);
        });
        it('retains element from `:host(element)` selector', () => {
          produce({ u: [':', 'host', { e: 'test-element' }] }, { hostSelector: { e: 'host-element' } });
          expect(renderedSelector).toEqual([{ e: 'test-element' }]);
        });
        it('retains element and namespace from `:host(ns|element) selector', () => {
          produce({ u: [':', 'host', { ns: 'test-ns' }] }, { hostSelector: { e: 'host-element' } });
          expect(renderedSelector).toEqual([{ ns: 'test-ns' }]);
        });

        it('assigns ID to `:host` selector', () => {
          produce({ u: [':', 'host'] }, { hostSelector: { i: 'host-id' } });
          expect(renderedSelector).toEqual([{ i: 'host-id' }]);
        });
        it('retains ID from `:host(#id)` selector', () => {
          produce({ u: [':', 'host', { i: 'test-id' }] }, { hostSelector: { i: 'host-id' } });
          expect(renderedSelector).toEqual([{ i: 'test-id' }]);
        });

        it('appends class to `:host(.class)` selector', () => {
          produce({ u: [':', 'host', { c: 'test-class' }] });
          expect(renderedSelector).toEqual([{ c: ['test-class', elementId] }]);
        });
        it('retains class of `:host(.class) selector', () => {
          produce({ u: [':', 'host', { c: 'test-class' }] }, { hostSelector: {} });
          expect(renderedSelector).toEqual([{ c: ['test-class'] }]);
        });

        it('appends sub-selector to `:host([attr])` selector', () => {
          produce({ u: [':', 'host', { u: ['test-attr'] }] }, { hostSelector: { u: ['::', 'after'] } });
          expect(renderedSelector).toEqual([{ u: [['test-attr'], ['::', 'after']] }]);
        });
        it('retains sub-selector from `:host([attr])` selector', () => {
          produce({ u: [':', 'host', { u: ['test-attr'] }] }, { hostSelector: {} });
          expect(renderedSelector).toEqual([{ u: [['test-attr']] }]);
        });
        it('assigns sub-selector to `:host` selector', () => {
          produce({ u: [':', 'host'] }, { hostSelector: { u: ['::', 'after'] } });
          expect(renderedSelector).toEqual([{ u: [['::', 'after']] }]);
        });

        it('appends suffix to `:host(.raw)` selector', () => {
          produce({ u: [':', 'host', '.test-suffix'] }, { hostSelector: { s: '.host-suffix' } });
          expect(renderedSelector).toEqual([{ s: '.test-suffix.host-suffix' }]);
        });
        it('retains suffix from `:host(.raw)` selector', () => {
          produce({ u: [':', 'host', '.test-suffix'] }, { hostSelector: {} });
          expect(renderedSelector).toEqual([{ s: '.test-suffix' }]);
        });
        it('assigns suffix to `:host` selector', () => {
          produce({ u: [':', 'host'] }, { hostSelector: { s: '.host-suffix' } });
          expect(renderedSelector).toEqual([{ s: '.host-suffix' }]);
        });

        it('retains qualifiers from `:host` selector', () => {
          produce({ u: [':', 'host'], $: '@test' });
          expect(renderedSelector).toEqual([{ c: [elementId], $: ['@test'] }]);
        });
        it('retains nested `:host` selectors', () => {
          produce([{ u: [':', 'host'] }, { e: 'test-element' }]);
          expect(renderedSelector).toEqual([{ c: [elementId] }, { e: 'test-element' }]);
        });

        it('prefixes combinator with host selector', () => {
          produce(['>', { e: 'test-element' }]);
          expect(renderedSelector).toEqual([{ c: [elementId] }, '>', { e: 'test-element' }]);
        });
        it('prefixes arbitrary selector with host one', () => {
          produce([{ e: 'test-element' }]);
          expect(renderedSelector).toEqual([{ c: [elementId] }, { e: 'test-element' }]);
        });
        it('prefixes arbitrary sub-selector with host selector', () => {
          produce([{ u: ['test-attr'] }]);
          expect(renderedSelector).toEqual([{ c: [elementId] }, { u: [['test-attr']] }]);
        });
      });

      function produce(selector: StypSelector, opts?: ComponentStypOptions): void {

        const { rules } = stypRoot();
        const rule = rules.add(selector);

        producer(
            rule.rules.self,
            {
              ...opts,
              renderer: mockRenderer,
            },
        );
      }
    });
  });
});
