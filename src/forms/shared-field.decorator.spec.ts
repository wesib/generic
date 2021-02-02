import { InGroup, inGroup, inValue } from '@frontmeans/input-aspects';
import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '../spec/test-element';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormShare } from './form.share';
import { SharedField } from './shared-field.decorator';
import { SharedForm } from './shared-form.decorator';

describe('forms', () => {
  describe('@SharedField', () => {
    it('shares field', async () => {

      @Component('test-element', { extend: { type: MockElement } })
      class TestComponent {

        @SharedField()
        readonly field = new Field<string>(inValue('test'));

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;

      expect(await context.get(FieldShare)).toBeInstanceOf(Field);
    });
    it('adds field to enclosing form', async () => {

      @Component(
          'form-element',
          {
            extend: { type: MockElement },
          },
      )
      class FormComponent {

        @SharedForm()
        readonly form: ValueTracker<Form>;

        constructor(context: ComponentContext) {
          this.form = trackValue(Form.forElement(inGroup({}), context.element));
        }

      }

      @Component(
          'field-element',
          {
            extend: { type: MockElement },
            feature: {
              needs: FormComponent,
            },
          },
      )
      class FieldComponent {

        @SharedField()
        readonly field = new Field<string>(inValue('test'));

      }

      const fieldDef = await testDefinition(FieldComponent);
      const formDef = await fieldDef.get(BootstrapContext).whenDefined(FormComponent);

      const formEl = document.createElement('form-element');
      const fieldEl = formEl.appendChild(document.createElement('field-element'));

      const fieldCtx = fieldDef.connectTo(fieldEl).context;
      const formCtx = formDef.connectTo(formEl).context;

      const form = await formCtx.get(FormShare);
      const field = await fieldCtx.get(FieldShare);
      const controls = await form!.control.aspect(InGroup)!.controls.read;

      expect(controls.get('field')).toBe(field!.control);
    });
  });
});
