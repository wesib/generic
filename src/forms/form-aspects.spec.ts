import { InControl, InNamespaceAliaser, InRenderScheduler, InStyledElement, inValue } from '@frontmeans/input-aspects';
import { newManualRenderScheduler, RenderScheduler } from '@frontmeans/render-scheduler';
import { ContextKey__symbol } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import {
  bootstrapComponents,
  BootstrapContext,
  Component,
  ComponentContext,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
  Feature,
} from '@wesib/wesib';
import { FormAspects } from './form-aspects';
import Mock = jest.Mock;

describe('forms', () => {
  describe('FormAspects', () => {

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

      bsContext = await bootstrapComponents(TestComponent).whenReady;

      const defContext = await bsContext.whenDefined(TestComponent);
      const element = document.createElement('test-element');

      context = defContext.mountTo(element).context;
      control = inValue(13).convert(context.get(FormAspects));
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
          setup.provide({ a: FormAspects, is: InStyledElement.to(styled) });
        },
      })
      class TestFeature {}

      await bsContext.load(TestFeature).whenReady;

      control = inValue(13).convert(context.get(FormAspects));
      expect(control.aspect(InStyledElement)).toBe(styled);
    });
    it('allows to overwrite the defaults', async () => {

      const scheduler = newManualRenderScheduler();

      @Feature({
        setup(setup) {
          setup.provide({ a: FormAspects, is: InRenderScheduler.to(scheduler) });
        },
      })
      class TestFeature {}

      await bsContext.load(TestFeature).whenReady;

      control = inValue(13).convert(context.get(FormAspects));
      expect(control.aspect(InRenderScheduler)).toBe(scheduler);
    });
    it('cuts off supply when component destroyed', () => {

      const whenOff = jest.fn();

      context.get(FormAspects[ContextKey__symbol].upKey)(noop).whenOff(whenOff);

      const reason = new Error('reason');

      context.destroy(reason);
      expect(whenOff).toHaveBeenCalledWith(reason);
    });
  });
});
