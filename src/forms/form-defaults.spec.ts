import { InControl, InElement, InGroup, inGroup, inValue } from '@frontmeans/input-aspects';
import { ContextKey__symbol, Contextual__symbol } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, afterSupplied, mapAfter, trackValue, ValueTracker } from '@proc7ts/fun-events';
import { Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { MockElement, testElement } from '../spec/test-element';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormDefaults } from './form-defaults';
import { FormShare } from './form.share';
import { SharedField } from './shared-field.decorator';
import { SharedForm } from './shared-form.decorator';

describe('forms', () => {
  describe('FormDefaults', () => {
    it('applied to field', async () => {

      const setup = jest.fn((_field: Field<any>, controls: AfterEvent<[Field.Controls<any>]>) => controls);

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormDefaults,
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

      expect(setup).toHaveBeenCalledWith(field, expect.any(Function));
    });
    it('applied to form', async () => {

      const setup = jest.fn((_form: Form, controls: AfterEvent<[Form.Controls<any, any>]>) => controls);

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormDefaults,
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

      expect(setup).toHaveBeenCalledWith(form, expect.any(Function));
    });
    it('tracks field rule changes', async () => {

      const ruleTracker: ValueTracker<FormDefaults.Spec> = trackValue({});
      let controlCounter = 0;

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormDefaults,
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

      const rules: jest.Mocked<FormDefaults.Spec> = {
        setupField: jest.fn((_field: Field<any>, controls: AfterEvent<[Field.Controls<any>]>) => controls),
      };

      ruleTracker.it = rules;
      expect(rules.setupField).toHaveBeenCalledTimes(1);
      expect(field.control.it).toBe('test2');
    });
    it('tracks form rule changes', async () => {

      const ruleTracker: ValueTracker<FormDefaults.Spec> = trackValue({});
      let controlCounter = 0;

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
            define(defContext) {
              defContext.perComponent({
                a: FormDefaults,
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

      const rules: jest.Mocked<FormDefaults.Spec> = {
        setupForm: jest.fn((_field: Form<any>, controls: AfterEvent<[Form.Controls<any, any>]>) => controls),
      };

      ruleTracker.it = rules;
      expect(rules.setupForm).toHaveBeenCalledTimes(1);
      expect(form.control.it.counter).toBe(2);
    });

    describe('instance', () => {
      describe('setupField', () => {

        let controlCounter: number;
        let ruleTracker: ValueTracker<FormDefaults.Spec>;
        let context: ComponentContext;
        let formDefaults: FormDefaults;

        beforeEach(async () => {
          controlCounter = 0;
          ruleTracker = trackValue({});

          @Component(
              'test-element',
              {
                extend: { type: MockElement },
                define(defContext) {
                  defContext.perComponent({
                    a: FormDefaults,
                    is: ruleTracker.read,
                  });
                },
              },
          )
          class TestComponent {
          }

          const element = new (await testElement(TestComponent))();

          context = await ComponentSlot.of(element).whenReady;
          formDefaults = context.get(FormDefaults);
        });

        describe('setupField', () => {
          it('reflects rule changes', async () => {

            const field = new Field<number>(() => ({ control: inValue(++controlCounter) }));

            expect(field[Contextual__symbol](context)).toBe(field);

            const controls = formDefaults.setupField(field, field.readControls);

            expect((await controls).control.it).toBe(1);

            ruleTracker.it = {
              setupField: (_field: Field<any>, controls: AfterEvent<[Field.Controls<any>]>) => controls.do(
                  mapAfter(cts => {
                    cts.control.it += 10;
                    return cts;
                  }),
              ),
            };

            expect((await controls).control.it).toBe(12);
          });
        });

        describe('setupForm', () => {
          it('reflects rule changes', async () => {

            const form = new Form<{ counter: number }>(() => Form.forElement(
                inGroup({ counter: ++controlCounter }),
                context.element,
            ));

            expect(form[Contextual__symbol](context)).toBe(form);

            const controls = formDefaults.setupForm(form, form.readControls);

            expect((await controls).control.it.counter).toBe(1);

            ruleTracker.it = {
              setupForm: (_form: Form<any>, controls: AfterEvent<[Form.Controls<any, any>]>) => controls.do(
                  mapAfter(cts => {
                    cts.control.it.counter += 10;
                    return cts;
                  }),
              ),
            };

            expect((await controls).control.it.counter).toBe(12);
          });
        });

        describe('[AfterEvent__symbol]', () => {
          it('reflects rule changes', () => {

            const rules = afterSupplied(formDefaults);
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

      let key: ContextUpKey<FormDefaults, FormDefaults.Spec>;

      beforeEach(() => {
        key = FormDefaults[ContextKey__symbol];
      });

      describe('upKey', () => {
        it('is the key itself', () => {
          expect(key.upKey).toBe(key);
        });
      });
    });

  });
});
