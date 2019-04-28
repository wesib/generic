import {
  Component,
  ComponentContext,
  ComponentDef,
  ComponentMount,
  DomProperty,
  Feature,
  Render,
  RenderScheduler, ShadowContentRoot, ShadowRootBuilder,
} from '@wesib/wesib';
import { noop } from 'call-thru';
import { trackValue } from 'fun-events';
import { StypProperties, stypRoot, StypRule, stypSelectorText } from 'style-producer';
import { testComponentFactory } from '../spec/test-element';
import { ElementIdClass } from './element-id-class';
import { ProduceComponentStyle } from './produce-component-style';
import { StyleProducerSupport } from './style-producer-support.feature';

describe('styp/component-style-producer', () => {

  let element: HTMLElement & {
    css: StypProperties;
  };

  beforeEach(() => {
    element = document.createElement('test-component') as any;
    document.body.append(element);
  });
  afterEach(() => {
    element.remove();
  });

  it('renders style', async () => {
    await connect();

    const style = cssStyle();

    expect(style.display).toBe('block');
  });
  it('updates style', async () => {
    await connect();

    element.css = { display: 'inline-block' };

    const style = cssStyle();

    expect(style.display).toBe('inline-block');
  });
  it('prepends element id class to CSS rule selector', async () => {

    const context = await connect();
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);

    expect(rule.selectorText).toBe(stypSelectorText({ c: idClass }));
  });
  it('prepends element id class to CSS rule selector of anonymous component', async () => {

    const context = await connect({});
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);
    const selector = stypSelectorText({ c: idClass });

    expect(rule.selectorText).toBe(selector);
    expect(selector).toMatch(/^\.component\\#\d+\\@/);
  });
  it('prepends `:host` CSS rule selector when shadow DOM supported', async () => {
    await connect({
      perComponent: {
        a: ShadowContentRoot,
        by(ctx: ComponentContext) {
          return ctx.element;
        },
      }
    });
    const rule = cssStyleRule();

    expect(rule.selectorText).toBe(':host');
  });

  async function connect(def?: ComponentDef): Promise<ComponentContext<any>> {

    const mnt = await mount(def);

    mnt.connected = true;

    return mnt.context;
  }

  async function mount(def: ComponentDef = { name: 'test-component' }): Promise<ComponentMount<any>> {

    @Component(def)
    @Feature({
      needs: StyleProducerSupport,
      set: {
        a: RenderScheduler,
        is: {
          scheduleRender(op: () => void) {
            op();
          },
        },
      }
    })
    class TestComponent {

      private readonly _produceStyle: ProduceComponentStyle;
      private readonly _root: StypRule;
      private readonly _css = trackValue<StypProperties>({ display: 'block' });

      constructor(ctx: ComponentContext<TestComponent>) {
        this._produceStyle = ctx.get(ProduceComponentStyle);
        this._root = stypRoot(this._css);
      }

      @Render()
      renderStyle() {
        this._produceStyle(this._root.rules);
        return noop; // Do not re-render
      }

      @DomProperty()
      set css(value: StypProperties) {
        this._css.it = value;
      }

    }

    const factory = await testComponentFactory(TestComponent);

    return factory.mountTo(element);
  }

  function cssStyle(): CSSStyleDeclaration {
    return cssStyleRule().style;
  }

  function cssStyleRule(): CSSStyleRule {

    const styles = element.querySelectorAll('style');

    expect(styles).toHaveLength(1);

    const style = styles[0];
    const sheet = style.sheet as CSSStyleSheet;
    const rule = sheet.cssRules[0] as CSSStyleRule;

    expect(rule).toBeDefined();

    return rule;
  }
});
