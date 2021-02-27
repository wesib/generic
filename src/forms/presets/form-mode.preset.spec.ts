import { inFormElement, inGroup, InMode, InValidation, inValue } from '@frontmeans/input-aspects';
import { afterThe } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext } from '@wesib/wesib';
import { MockElement, testDefinition } from '../../spec/test-element';
import { Field } from '../field';
import { FieldShare } from '../field.share';
import { Form } from '../form';
import { FormShare } from '../form.share';
import { SharedField } from '../shared-field.decorator';
import { SharedForm } from '../shared-form.decorator';
import { FormModePreset } from './form-mode.preset';

describe('forms', () => {
  describe('FormModePreset', () => {

    it('reflects form validity by default', async () => {

      const [{ control }] = await bootstrap();

      control?.aspect(InValidation).by(afterThe({ invalid: true }));

      expect(await control?.aspect(InMode).read).toBe('-on');
    });
    it('reflects form validity with custom mode', async () => {

      const [{ control }] = await bootstrap({ byValidity: { invalid: 'on' } });

      control?.aspect(InValidation).by(afterThe({ invalid: true }));

      expect(await control?.aspect(InMode).read).toBe('on');
    });
    it('does not reflect form validity when disabled', async () => {

      const [{ control }] = await bootstrap({ byValidity: false });

      control?.aspect(InValidation).by(afterThe({ invalid: true }));

      expect(await control?.aspect(InMode).read).toBe('on');
    });
    it('reflects form element mode by field by default', async () => {

      const [{ element: form }, { control: field }] = await bootstrap();

      form!.aspect(InMode).own.it = 'off';

      expect(await field?.aspect(InMode).read).toBe('off');
    });
    it('does not reflect form element mode by field when disabled', async () => {

      const [{ element: form }, { control: field }] = await bootstrap({ byForm: false });

      form!.aspect(InMode).own.it = 'off';

      expect(await field?.aspect(InMode).read).toBe('on');
    });
    it('handles adding to non-form container', async () => {

      const form = inGroup<{ test: string }>({ test: '' });
      const [, { control: field }] = await bootstrap();

      form.controls.set('test', field);
      form.aspect(InMode).own.it = 'off';

      expect(await field?.aspect(InMode).read).toBe('on');
    });

  });

  async function bootstrap(options?: FormModePreset.Options): Promise<[form: Form, field: Field<string>]> {

    @Component(
        'test-form',
        {
          extend: { type: MockElement },
          feature: {
            needs: options ? [] : FormModePreset,
            setup: setup => {
              if (options) {
                setup.provide(new FormModePreset(options));
              }
            },
          },
        },
    )
    class TestFormComponent {

      @SharedForm()
      readonly form: Form;

      constructor(context: ComponentContext) {
        this.form = Form.by<any>(
            opts => inGroup({}, opts),
            opts => inFormElement(context.element, opts),
        );
      }

    }

    @Component(
        'test-field',
        {
          extend: { type: MockElement },
          feature: {
            needs: TestFormComponent,
          },
        },
    )
    class TestFieldComponent {

      @SharedField()
      readonly field: Field<string>;

      constructor() {
        this.field = Field.by(opts => inValue('test', opts));
      }

    }

    const fieldDef = await testDefinition(TestFieldComponent);
    const formDef = await fieldDef.get(BootstrapContext).whenDefined(TestFormComponent);

    const formEl = document.createElement('test-form');
    const fieldEl = formEl.appendChild(document.createElement('test-field'));

    const form = (await formDef.connectTo(formEl).context.get(FormShare))!;
    const field = (await fieldDef.connectTo(fieldEl).context.get(FieldShare))!;

    expect(form).not.toBe(field);

    return [form, field];
  }

});
