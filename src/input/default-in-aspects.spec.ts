import { ContextKey__symbol } from '@proc7ts/context-values';
import { InControl, InNamespaceAliaser, InRenderScheduler, InStyledElement, inValue } from '@proc7ts/input-aspects';
import { newManualRenderScheduler, RenderScheduler } from '@proc7ts/render-scheduler';
import {
  bootstrapComponents,
  BootstrapContext,
  Component,
  ComponentContext,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
  Feature,
} from '@wesib/wesib';
import { DefaultInAspects } from './default-in-aspects';
import Mock = jest.Mock;

describe('input', () => {
  describe('DefaultInAspects', () => {

    let mockRenderScheduler: Mock<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>;
    let bsContext: BootstrapContext;
    let context: ComponentContext;
    let control: InControl<any>;

    beforeEach(async () => {
      mockRenderScheduler = jest.fn(newManualRenderScheduler());

      @Component({
        feature: {
          setup(setup) {
            setup.perComponent({ a: ElementRenderScheduler, is: mockRenderScheduler });
          },
        },
      })
      class TestComponent {}

      bsContext = await bootstrapComponents(TestComponent).whenReady();

      const defContext = await bsContext.whenDefined(TestComponent);
      const element = document.createElement('test-element');

      context = defContext.mountTo(element).context;
      context.get(DefaultInAspects).to(aspects => {
        control = inValue(13).convert(aspects);
      });
    });

    it('delegates `InRenderScheduler` to `ElementRenderScheduler`', () => {

      const scheduler = control.aspect(InRenderScheduler);
      const opts = { node: document.createElement('div') };

      scheduler(opts);

      expect(mockRenderScheduler).toHaveBeenLastCalledWith({ ...opts });
    });
    it('sets `InNamespaceAliaser` to `DefaultNamespaceAliaser`', () => {
      expect(control.aspect(InNamespaceAliaser)).toBe(context.get(DefaultNamespaceAliaser));
    });
    it('respects custom aspects', async () => {

      const styled = document.createElement('div');

      @Feature({
        setup(setup) {
          setup.provide({ a: DefaultInAspects, is: InStyledElement.to(styled) });
        },
      })
      class TestFeature {}

      await new Promise(resolve => bsContext.load(TestFeature).read(({ ready }) => ready && resolve()));

      expect(control.aspect(InStyledElement)).toBe(styled);
    });
    it('allows to overwrite the defaults', async () => {

      const scheduler = newManualRenderScheduler();

      @Feature({
        setup(setup) {
          setup.provide({ a: DefaultInAspects, is: InRenderScheduler.to(scheduler) });
        },
      })
      class TestFeature {}

      await new Promise(resolve => bsContext.load(TestFeature).read(({ ready }) => ready && resolve()));

      expect(control.aspect(InRenderScheduler)).toBe(scheduler);
    });

    describe('upKey', () => {
      it('is the key itself', () => {
        expect(DefaultInAspects[ContextKey__symbol].upKey).toBe(DefaultInAspects[ContextKey__symbol]);
      });
    });
  });
});
