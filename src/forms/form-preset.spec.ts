import {
  InBuilder,
  InControl,
  InElement,
  inFormElement,
  InFormElement,
  InGroup,
  inGroup,
  InNamespaceAliaser,
  InRenderScheduler,
  inValue,
} from '@frontmeans/input-aspects';
import { newManualRenderScheduler, RenderScheduler } from '@frontmeans/render-scheduler';
import { ContextKey__symbol, Contextual__symbol } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { afterSupplied, trackValue, ValueTracker } from '@proc7ts/fun-events';
import {
  Component,
  ComponentContext,
  ComponentSlot,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
} from '@wesib/wesib';
import { MockElement, testElement } from '../spec/test-element';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormPreset } from './form-preset';
import { FormShare } from './form.share';
import { SharedField } from './shared-field.decorator';
import { SharedForm } from './shared-form.decorator';

describe('forms', () => {
  describe('FormPreset', () => {
    it('is applied to field', async () => {

      const setup = jest.fn();

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormPreset,
                is: {
                  setupField: setup,
                },
              });
            },
          },
      )
      class TestComponent {

        @SharedField()
        readonly field = new Field<string>({ control: inValue('test') });

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const field = await context.get(FieldShare);

      expect(field?.sharer).toBe(context);
      expect(field?.control).toBeInstanceOf(InControl);

      expect(setup).toHaveBeenCalledWith(expect.objectContaining({ sharer: context, field }));
    });
    it('is applied to form', async () => {

      const setup = jest.fn();

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormPreset,
                is: {
                  setupForm: setup,
                },
              });
            },
          },
      )
      class TestComponent {

        @SharedForm()
        readonly form: Form;

        constructor(context: ComponentContext) {
          this.form = new Form(Form.forElement(inGroup({}), context.element));
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const form = await context.get(FormShare);

      expect(form?.sharer).toBe(context);
      expect(form?.control).toBeInstanceOf(InGroup);
      expect(form?.element).toBeInstanceOf(InElement);

      expect(setup).toHaveBeenCalledWith(expect.objectContaining({ sharer: context, form }));
    });
    it('tracks field rule changes', async () => {

      const ruleTracker: ValueTracker<FormPreset.Spec> = trackValue({});
      let controlCounter = 0;

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormPreset,
                is: ruleTracker.read,
              });
            },
          },
      )
      class TestComponent {

        @SharedField()
        readonly field = new Field<string>(() => ({ control: inValue(`test${++controlCounter}`) }));

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const field = (await context.get(FieldShare))!;

      expect(field.control.it).toBe('test1');

      const rules: jest.Mocked<FormPreset.Spec> = {
        setupField: jest.fn(),
      };

      ruleTracker.it = rules;
      expect(rules.setupField).toHaveBeenCalledTimes(1);
      expect(field.control.it).toBe('test2');
    });
    it('tracks form rule changes', async () => {

      const ruleTracker: ValueTracker<FormPreset.Spec> = trackValue({});
      let controlCounter = 0;

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormPreset,
                is: ruleTracker.read,
              });
            },
          },
      )
      class TestComponent {

        @SharedForm()
        readonly form: Form;

        constructor(context: ComponentContext) {
          this.form = new Form(() => Form.forElement(inGroup({ counter: ++controlCounter }), context.element));
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const form = (await context.get(FormShare))!;

      expect(form.control.it.counter).toBe(1);

      const rules: jest.Mocked<FormPreset.Spec> = {
        setupForm: jest.fn(),
      };

      ruleTracker.it = rules;
      expect(rules.setupForm).toHaveBeenCalledTimes(1);
      expect(form.control.it.counter).toBe(2);
    });

    describe('defaults', () => {

      let mockRenderScheduler: jest.Mock<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>;
      let context: ComponentContext;
      let form: Form;
      let field: Field<string>;

      beforeEach(async () => {

        mockRenderScheduler = jest.fn(newManualRenderScheduler());

        @Component(
            'test-element',
            {
              extend: { type: MockElement },
              feature: {
                setup(setup) {
                  setup.perComponent({ a: ElementRenderScheduler, is: mockRenderScheduler });
                },
              },
            },
        )
        class TestComponent {

          @SharedField()
          readonly field = Field.by(opts => inValue('test', opts));

          @SharedForm()
          readonly form: Form;

          constructor(context: ComponentContext) {
            this.form = Form.by(
                opts => inGroup<any>({}, opts),
                opts => inFormElement(context.element, opts),
            );
          }

        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        form = (await context.get(FormShare))!;
        field = (await context.get(FieldShare))!;
      });

      describe('form control', () => {
        it('delegates `InRenderScheduler` to `ElementRenderScheduler`', () => {

          const scheduler = form.control.aspect(InRenderScheduler);
          const opts = { node: document.createElement('div') };

          scheduler(opts);

          expect(mockRenderScheduler).toHaveBeenLastCalledWith({ ...opts });
        });
        it('sets `InNamespaceAliaser` to `DefaultNamespaceAliaser`', () => {
          expect(form.control.aspect(InNamespaceAliaser)).toBe(context.get(DefaultNamespaceAliaser));
        });
      });

      describe('form element', () => {
        it('delegates `InRenderScheduler` to `ElementRenderScheduler`', () => {

          const scheduler = form.element.aspect(InRenderScheduler);
          const opts = { node: document.createElement('div') };

          scheduler(opts);

          expect(mockRenderScheduler).toHaveBeenLastCalledWith({ ...opts });
        });
        it('sets `InNamespaceAliaser` to `DefaultNamespaceAliaser`', () => {
          expect(form.element.aspect(InNamespaceAliaser)).toBe(context.get(DefaultNamespaceAliaser));
        });
      });

      describe('field', () => {
        it('delegates `InRenderScheduler` to `ElementRenderScheduler`', () => {

          const scheduler = field.control.aspect(InRenderScheduler);
          const opts = { node: document.createElement('div') };

          scheduler(opts);

          expect(mockRenderScheduler).toHaveBeenLastCalledWith({ ...opts });
        });
        it('sets `InNamespaceAliaser` to `DefaultNamespaceAliaser`', () => {
          expect(field.control.aspect(InNamespaceAliaser)).toBe(context.get(DefaultNamespaceAliaser));
        });
      });

    });

    describe('instance', () => {
      describe('setupField', () => {

        let controlCounter: number;
        let ruleTracker: ValueTracker<FormPreset.Spec>;
        let context: ComponentContext;
        let formPreset: FormPreset;

        beforeEach(async () => {
          controlCounter = 0;
          ruleTracker = trackValue({});

          @Component(
              'test-element',
              {
                extend: { type: MockElement },
                define(defContext) {
                  defContext.perComponent({
                    a: FormPreset,
                    is: ruleTracker.read,
                  });
                },
              },
          )
          class TestComponent {
          }

          const element = new (await testElement(TestComponent))();

          context = await ComponentSlot.of(element).whenReady;
          formPreset = context.get(FormPreset);
        });

        describe('setupField', () => {
          it('reflects rule changes', () => {

            const createControls = (builder: Field.Builder<number, any>): Field.Controls<number> => ({
              control: builder.control.build(opts => inValue(++controlCounter, opts)),
            });
            const field = new Field<number>(createControls);

            expect(field[Contextual__symbol](context)).toBe(field);

            const builder1: Field.Builder<number, any> = {
              sharer: context,
              field,
              control: new InBuilder<InControl<number>>(),
            };

            formPreset.setupField(builder1);
            expect(createControls(builder1).control.it).toBe(1);

            ruleTracker.it = {
              setupField: (builder: Field.Builder<any, any>) => {
                builder.control.setup(ctl => ctl.it += 10);
              },
            };

            const builder2: Field.Builder<number, any> = {
              sharer: context,
              field,
              control: new InBuilder<InControl<number>>(),
            };

            formPreset.setupField(builder2);
            expect(createControls(builder2).control.it).toBe(12);
          });
        });

        describe('setupForm', () => {
          it('reflects rule changes', () => {

            const createControls = (
                builder: Form.Builder<{ counter: number }, any, any>,
            ): Form.Controls<{ counter: number }> => Form.forElement(
                builder.control.build(opts => inGroup({ counter: ++controlCounter }, opts)),
                context.element,
            );
            const form = new Form<{ counter: number }>(createControls);

            expect(form[Contextual__symbol](context)).toBe(form);

            const builder1: Form.Builder<{ counter: number }, any, any> = {
              sharer: context,
              form,
              control: new InBuilder<InControl<{ counter: number }>>(),
              element: new InBuilder<InFormElement>(),
            };

            formPreset.setupForm(builder1);
            expect(createControls(builder1).control.it.counter).toBe(1);

            ruleTracker.it = {
              setupForm: (builder: Form.Builder<any, any, any>) => {
                builder.control.setup(ctl => ctl.it.counter += 10);
              },
            };

            const builder2: Form.Builder<{ counter: number }, any, any> = {
              sharer: context,
              form,
              control: new InBuilder<InControl<{ counter: number }>>(),
              element: new InBuilder<InFormElement>(),
            };

            formPreset.setupForm(builder2);
            expect(createControls(builder2).control.it.counter).toBe(12);
          });
        });

        describe('[AfterEvent__symbol]', () => {
          it('reflects rule changes', () => {

            const rules = afterSupplied(formPreset);
            const receiver = jest.fn();

            rules(receiver);
            expect(receiver).toHaveBeenCalledTimes(1);

            ruleTracker.it = {};
            expect(receiver).toHaveBeenCalledTimes(2);
          });
        });
      });
    });

    describe(`[ContextKey__symbol]`, () => {

      let key: ContextUpKey<FormPreset, FormPreset.Spec>;

      beforeEach(() => {
        key = FormPreset[ContextKey__symbol];
      });

      describe('upKey', () => {
        it('is the key itself', () => {
          expect(key.upKey).toBe(key);
        });
      });
    });

  });
});
