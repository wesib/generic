import {
  Component,
  ComponentContext,
  ComponentDef,
  ComponentMount,
  Feature, RenderSchedule,
  RenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { trackValue } from 'fun-events';
import { StypProperties, stypRoot, StypRule, StypRules, stypSelectorText } from 'style-producer';
import { testComponentFactory } from '../spec/test-element';
import { ComponentStypOptions } from './component-styp-options';
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
    await mount();
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles', async () => {
    await mount(stypRoot({ display: 'block' }).rules);
    expect(cssStyle().display).toBe('block');
  });
  it('renders styles immediately when `offline="always"`', async () => {
    await mount(undefined, undefined, { offline: 'always' });
    expect(cssStyle().display).toBe('block');
  });
  it('removes styles on disconnection when `offline=false`', async () => {

    const mnt = await mount(undefined, undefined, { offline: false });

    mnt.connected = false;
    expect(mnt.context.element.querySelectorAll('style')).toHaveLength(0);
  });
  it('does not remove styles on disconnection', async () => {

    const mnt = await mount();

    mnt.connected = false;
    expect(cssStyle().display).toBe('block');
  });
  it('removes styles on component destruction', async () => {

    const mnt = await mount();

    mnt.context.destroy();
    expect(mnt.context.element.querySelectorAll('style')).toHaveLength(0);
  });
  it('updates style', async () => {

    const css = trackValue<StypProperties>({ display: 'block' });

    await mount(stypRoot(css));

    css.it = { display: 'inline-block' };
    expect(cssStyle().display).toBe('inline-block');
  });
  it('prepends element id class to CSS rule selector', async () => {

    const context = (await mount()).context;
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);

    expect(rule.selectorText).toBe(stypSelectorText({ c: idClass }));
  });
  it('prepends element id class to CSS rule selector of anonymous component', async () => {

    const context = (await mount(undefined, {})).context;
    const rule = cssStyleRule();
    const idClass = context.get(ElementIdClass);
    const selector = stypSelectorText({ c: idClass });

    expect(rule.selectorText).toBe(selector);
    expect(selector).toMatch(/^\.component\\#\d+\\@/);
  });
  it('prepends `:host` CSS rule selector when shadow DOM supported', async () => {
    await mount(undefined, {
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

  async function mount(
      style: StypRule | StypRules = stypRoot({ display: 'block' }),
      def: ComponentDef = { name: 'test-component' },
      options?: ComponentStypOptions):
      Promise<ComponentMount<any>> {

    @Component(def)
    @Feature({
      needs: StyleProducerSupport,
      set: {
        a: RenderScheduler,
        is: {
          newSchedule(): RenderSchedule {
            return {
              schedule(op: () => void) {
                op();
              },
            };
          },
        },
      }
    })
    class TestComponent {

      @ProduceStyle(options)
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
