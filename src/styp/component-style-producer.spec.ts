import {
  Component,
  ComponentContext,
  ComponentDef,
  ComponentMount,
  Feature,
  RenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { trackValue } from 'fun-events';
import { StypProperties, stypRoot, StypRule, StypRules, stypSelectorText } from 'style-producer';
import { testComponentFactory } from '../spec/test-element';
import { ElementIdClass } from './element-id-class';
import { ProduceStyle } from './produce-style.decorator';
import { StyleProducerSupport } from './style-producer-support.feature';

describe('styp/component-style-producer', () => {

  let element: HTMLElement;

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
  it('renders styles', async () => {
    await connect(stypRoot({ display: 'block' }).rules);

    const style = cssStyle();

    expect(style.display).toBe('block');
  });
  it('updates style', async () => {

    const css = trackValue<StypProperties>({ display: 'block' });

    await connect(stypRoot(css));

    css.it = { display: 'inline-block' };

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

    const context = await connect(undefined, {});
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);
    const selector = stypSelectorText({ c: idClass });

    expect(rule.selectorText).toBe(selector);
    expect(selector).toMatch(/^\.component\\#\d+\\@/);
  });
  it('prepends `:host` CSS rule selector when shadow DOM supported', async () => {
    await connect(undefined, {
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

  async function connect(
      style?: StypRule | StypRules,
      def?: ComponentDef): Promise<ComponentContext<any>> {

    const mnt = await mount(style, def);

    mnt.connected = true;

    return mnt.context;
  }

  async function mount(
      style: StypRule | StypRules = stypRoot({ display: 'block' }),
      def: ComponentDef = { name: 'test-component' }):
      Promise<ComponentMount<any>> {

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

      @ProduceStyle()
      get style(): StypRule | StypRules {
        return style;
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
