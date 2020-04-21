import { ContextRegistry } from '@proc7ts/context-values';
import { eventSupply, EventSupply, EventSupply__symbol, trackValue } from '@proc7ts/fun-events';
import { newNamespaceAliaser } from '@proc7ts/namespace-aliaser';
import {
  immediateRenderScheduler,
  newManualRenderScheduler,
  RenderSchedule,
  RenderScheduler,
} from '@proc7ts/render-scheduler';
import {
  produceBasicStyle,
  StypFormatConfig,
  StypRenderer,
  stypRoot,
  StypSelector,
  stypSelector,
} from '@proc7ts/style-producer';
import {
  BootstrapWindow,
  ComponentContext,
  DefaultNamespaceAliaser,
  DefaultRenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ComponentStyleProducer } from './component-style-producer';
import { ComponentStypDomFormat } from './component-styp-dom.format';
import { ComponentStypFormatConfig } from './component-styp-format';
import { ElementIdClass, ElementIdClass__NS } from './element-id-class.impl';
import Mock = jest.Mock;

describe('styp', () => {

  let done: EventSupply;

  beforeEach(() => {
    done = eventSupply();
  });
  afterEach(() => {
    done.off();
  });

  let registry: ContextRegistry<ComponentContext>;
  let context: jest.Mocked<ComponentContext>;

  beforeEach(() => {
    registry = new ContextRegistry();

    const values = registry.newValues();
    const ready = trackValue<ComponentContext>();

    context = {
      [EventSupply__symbol]: eventSupply(),
      whenReady: ready.read().F,
      get: values.get,
      contentRoot: document.createElement('content-root'),
    } as any;
    ready.it = context;

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

  let mockProduceStyle: Mock<ReturnType<typeof produceBasicStyle>, Parameters<typeof produceBasicStyle>>;

  beforeEach(() => {
    mockProduceStyle = jest.fn(produceBasicStyle);
    registry.provide({
      a: ComponentStyleProducer,
      is: mockProduceStyle,
    });
  });

  describe('ComponentStypDomFormat', () => {

    let format: ComponentStypDomFormat;

    beforeEach(() => {
      format = new ComponentStypDomFormat(context);
    });

    describe('config', () => {
      describe('document', () => {
        it('defaults to bootstrap window document', () => {

          const doc = document.implementation.createHTMLDocument('test');

          registry.provide({ a: BootstrapWindow, is: { document: doc } as BootstrapWindow });

          expect(format.config()).toMatchObject({ document: doc });
        });
        it('respects explicit value', () => {

          const doc = document.implementation.createHTMLDocument('test');

          expect(format.config({ document: doc })).toMatchObject({ document: doc });
        });
      });

      describe('parent', () => {
        it('defaults to component content root', () => {
          expect(format.config()).toMatchObject({ parent: context.contentRoot });
        });
        it('respects explicit value', () => {

          const parent = document.createElement('content-parent');

          expect(format.config({ parent })).toMatchObject(parent);
        });
      });

      describe('rootSelector', () => {
        it('is empty by default', () => {
          expect(format.config()).toMatchObject({ rootSelector: [] });
        });
        it('ignores explicit value', () => {
          expect(format.config({
            rootSelector: 'some',
          } as StypFormatConfig as ComponentStypFormatConfig)).toMatchObject({
            rootSelector: [],
          });
        });
      });

      describe('scheduler', () => {
        it('defaults to render scheduler', () => {
          produce();
          expect(mockProduceStyle).toHaveBeenCalled();

          const scheduler = mockProduceStyle.mock.calls[0][1]!.scheduler!;
          const config = { window, name: 'options' };

          scheduler(config);

          expect(mockRenderScheduler).toHaveBeenCalled();
        });
        it('respects explicit value', () => {

          const scheduler = newManualRenderScheduler();

          expect(format.config({ scheduler })).toMatchObject({ scheduler });
        });
      });

      describe('nsAlias', () => {
        it('defaults to default namespace alias', () => {
          expect(format.config()).toMatchObject({ nsAlias: context.get(DefaultNamespaceAliaser) });
        });
        it('respects explicit value', () => {

          const nsAlias = newNamespaceAliaser();

          expect(format.config({ nsAlias })).toMatchObject({ nsAlias });
        });
      });

      describe('renderer', () => {
        it('respects explicit value', () => {
          produce();
          expect(mockRenderer).toHaveBeenCalled();
        });
      });

      function produce(config: ComponentStypFormatConfig = {}): void {
        format.produce(
            stypRoot({ font: 'serif' }).rules,
            {
              ...config,
              renderer: mockRenderer,
            },
        ).needs(done);
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

      function produce(selector: StypSelector, config?: ComponentStypFormatConfig): void {

        const { rules } = stypRoot();
        const rule = rules.add(selector);

        format.produce(
            rule.rules.self,
            {
              ...config,
              renderer: mockRenderer,
            },
        ).needs(done);
      }
    });
  });
});
