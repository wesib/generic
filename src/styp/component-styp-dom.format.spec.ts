import { newNamespaceAliaser } from '@frontmeans/namespace-aliaser';
import { immediateRenderScheduler } from '@frontmeans/render-scheduler';
import { ContextRegistry } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { ComponentContext, DefaultNamespaceAliaser, ElementRenderer, ElementRenderScheduler } from '@wesib/wesib';
import { componentStypDomFormatConfig } from './component-styp-dom.format-config';
import { ComponentStypFormat } from './component-styp-format';

describe('styp', () => {
  describe('componentStypDomFormatConfig', () => {

    let context: ComponentContext;
    let format: ComponentStypFormat;
    let scheduler: jest.Mock;

    beforeEach(() => {

      const registry = new ContextRegistry<ComponentContext>();

      registry.provide({ a: DefaultNamespaceAliaser, by: newNamespaceAliaser });

      scheduler = jest.fn(immediateRenderScheduler);

      registry.provide({ a: ElementRenderScheduler, is: scheduler });

      context = registry.newValues() as ComponentContext;
      format = {
        context,
        renderer(): ElementRenderer {
          return noop;
        },
      } as any;
    });

    it('does not modify schedule options by default', () => {

      const config = componentStypDomFormatConfig(format);

      config.scheduler!()(noop);
      expect(scheduler).toHaveBeenCalledWith({});
    });
    it('applies render definition to schedule options by default', () => {

      const config = componentStypDomFormatConfig(format, undefined, { when: 'connected' });

      config.scheduler!({ window })(noop);
      expect(scheduler).toHaveBeenCalledWith({ window, when: 'connected' });
    });
  });
});
