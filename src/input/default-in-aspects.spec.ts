import {
  bootstrapComponents,
  BootstrapContext,
  DefaultNamespaceAliaser,
  DefaultRenderScheduler,
  Feature,
} from '@wesib/wesib';
import { InControl, InNamespaceAliaser, InRenderScheduler, InStyledElement, inValue } from 'input-aspects';
import { newManualRenderScheduler } from 'render-scheduler';
import { DefaultInAspects } from './default-in-aspects';

describe('input', () => {
  describe('DefaultInAspects', () => {

    let context: BootstrapContext;
    let control: InControl<any>;

    beforeEach(async () => {
      context = await new Promise<BootstrapContext>(resolve => bootstrapComponents().whenReady(resolve));
      context.get(DefaultInAspects)(aspects => {
        control = inValue(13).convert(aspects);
      });
    });

    it('sets `InRenderScheduler` to `DefaultRenderScheduler`', () => {
      expect(control.aspect(InRenderScheduler)).toBe(context.get(DefaultRenderScheduler));
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
  });
});
