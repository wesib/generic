import {
  bootstrapComponents,
  BootstrapContext,
  DefaultNamespaceAliaser,
  DefaultRenderScheduler,
  Feature,
} from '@wesib/wesib';
import { ContextKey__symbol } from 'context-values';
import { InControl, InNamespaceAliaser, InRenderScheduler, InStyledElement, inValue } from 'input-aspects';
import { newManualRenderScheduler, RenderScheduler } from 'render-scheduler';
import { DefaultInAspects } from './default-in-aspects';
import Mock = jest.Mock;

describe('input', () => {
  describe('DefaultInAspects', () => {

    let mockRenderScheduler: Mock<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>;
    let context: BootstrapContext;
    let control: InControl<any>;

    beforeEach(async () => {
      mockRenderScheduler = jest.fn(newManualRenderScheduler());

      @Feature({
        setup(setup) {
          setup.provide({ a: DefaultRenderScheduler, is: mockRenderScheduler });
        },
      })
      class TestFeature {}

      context = await new Promise(bootstrapComponents(TestFeature).whenReady);
      context.get(DefaultInAspects)(aspects => {
        control = inValue(13).convert(aspects);
      });
    });

    it('delegates `InRenderScheduler` to `DefaultRenderScheduler`', () => {

      const scheduler = control.aspect(InRenderScheduler);
      const opts = { node: document.createElement('div') };

      scheduler(opts);

      expect(mockRenderScheduler).toHaveBeenLastCalledWith(opts);
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

      await new Promise(resolve => context.load(TestFeature).read(({ ready }) => ready && resolve()));

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

      await new Promise(resolve => context.load(TestFeature).read(({ ready }) => ready && resolve()));

      expect(control.aspect(InRenderScheduler)).toBe(scheduler);
    });

    describe('upKey', () => {
      it('is the key itself', () => {
        expect(DefaultInAspects[ContextKey__symbol].upKey).toBe(DefaultInAspects[ContextKey__symbol]);
      });
    });
  });
});
