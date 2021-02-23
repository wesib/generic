import { inFormElement, inGroup } from '@frontmeans/input-aspects';
import { ContextBuilder } from '@proc7ts/context-values';
import { AfterEvent } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol } from '../share';
import { ComponentShareRegistry } from '../share/component-share-registry.impl';
import { SharedByComponent$ContextBuilder } from '../share/shared-by-component.impl';
import { testDefinition, testElement } from '../spec/test-element';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormShare } from './form.share';

describe('forms', () => {
  describe('FormShare', () => {

    let formShare: FormShare;
    let fieldShare: FieldShare;

    beforeEach(() => {
      formShare = FormShare[ComponentShare__symbol];
      fieldShare = FieldShare[ComponentShare__symbol];
    });

    describe('addSharer', () => {

      let bsContext: BootstrapContext;
      let defContext: DefinitionContext;
      let registry: ComponentShareRegistry;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {
        }

        defContext = await testDefinition(TestComponent);
        bsContext = defContext.get(BootstrapContext);
        registry = bsContext.get(ComponentShareRegistry);
      });

      it('registers form sharer', () => {

        const supply = formShare.addSharer(defContext);

        expect(sharerNames(formShare)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(formShare)).toHaveLength(0);
      });
      it('registers field sharer', () => {

        const supply = formShare.addSharer(defContext);

        expect(sharerNames(fieldShare)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(fieldShare)).toHaveLength(0);
      });
      it('registers field sharer for specific share', () => {

        interface TestModel {
          test: string;
        }

        const fieldShare = new FieldShare<TestModel>('custom-field');
        const formShare = new FormShare<TestModel>('custom-form', { asField: fieldShare });

        const supply = formShare.addSharer(defContext);

        expect(sharerNames(fieldShare)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(fieldShare)).toHaveLength(0);
      });

      function sharerNames(share: ComponentShare<unknown>): readonly string[] {
        return [...registry.sharers(share).it.names.keys()];
      }
    });

    describe('shareValue', () => {

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: Object },
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
      it('shares field', async () => {
        expect(await context.get(fieldShare)).toBe(form);
      });
      it('shares specific field', async () => {

        interface TestModel {
          test: string;
        }

        const fieldShare = new FieldShare<TestModel>('custom-field');
        const formShare = new FormShare<TestModel>('custom-form', { asField: fieldShare });

        defContext.perComponent(shareValue(formShare, () => form));
        expect(await context.get(fieldShare)).toBe(form);
      });
    });

    function shareValue<T, TComponent extends object>(
        share: ComponentShare<T>,
        provide: <TCtx extends TComponent>(context: ComponentContext<TCtx>) => T | AfterEvent<[T?]>,
        priority?: number,
    ): ContextBuilder<ComponentContext<TComponent>> {
      return SharedByComponent$ContextBuilder<T, TComponent>(
          share,
          {
            priority,
            provide,
          },
      );
    }
  });
});
