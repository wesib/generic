import { inFormElement, inGroup } from '@frontmeans/input-aspects';
import { ContextBuilder } from '@proc7ts/context-values';
import { AfterEvent } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '@wesib/wesib/testing';
import { Share, Share__symbol } from '../shares';
import { ShareRegistry } from '../shares/share-registry.impl';
import { SharedValue$ContextBuilder } from '../shares/shared-value.impl';
import { Form } from './form';
import { FormShare } from './form.share';

describe('forms', () => {
  describe('FormShare', () => {

    let formShare: FormShare;

    beforeEach(() => {
      formShare = FormShare[Share__symbol];
    });

    describe('addSharer', () => {

      let bsContext: BootstrapContext;
      let defContext: DefinitionContext;
      let registry: ShareRegistry;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {
        }

        defContext = await testDefinition(TestComponent);
        bsContext = defContext.get(BootstrapContext);
        registry = bsContext.get(ShareRegistry);
      });

      it('registers form sharer', () => {

        const supply = formShare.addSharer(defContext);

        expect(sharerNames(formShare)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(formShare)).toHaveLength(0);
      });

      function sharerNames(share: Share<unknown>): readonly string[] {
        return [...registry.sharers(share).it.names.keys()];
      }
    });

    describe('shareValue', () => {

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: MockElement },
        })
        class TestComponent {
        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      let form: Form;

      beforeEach(() => {

        const group = inGroup({});

        form = new Form({
            control: group,
            element: inFormElement(document.createElement('form'), { form: group }),
        });
        defContext.perComponent(shareValue(formShare, () => form));
      });

      it('shares form', async () => {
        expect(await context.get(formShare)).toBe(form);
      });
    });

    function shareValue<T, TComponent extends object>(
        share: Share<T>,
        provide: <TCtx extends TComponent>(context: ComponentContext<TCtx>) => T | AfterEvent<[T?]>,
        priority?: number,
    ): ContextBuilder<ComponentContext<TComponent>> {
      return SharedValue$ContextBuilder<T, TComponent>(
          share,
          {
            priority,
            provide,
          },
      );
    }
  });
});
