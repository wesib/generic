import { InCssClasses, inFormElement, inGroup, InMode, InValidation, inValue } from '@frontmeans/input-aspects';
import { DEFAULT__NS } from '@frontmeans/namespace-aliaser';
import { trackValue, trackValueBy } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext } from '@wesib/wesib';
import { MockElement, testDefinition } from '../../spec/test-element';
import { Field } from '../field';
import { FieldShare } from '../field.share';
import { Form } from '../form';
import { FormShare } from '../form.share';
import { SharedField } from '../shared-field.decorator';
import { SharedForm } from '../shared-form.decorator';
import { FormCssPreset } from './form-css.preset';

describe('forms', () => {
  describe('FormCssPreset', () => {

    it('reflects field validity by default', async () => {

      const [, { control }] = await bootstrap();

      control.aspect(InValidation).by(trackValue({ invalid: true }));

      expect(await control.aspect(InCssClasses).read).toMatchObject({ 'has-error@inasp': true });
    });
    it('reflects field validity with custom class', async () => {

      const [, { control }] = await bootstrap({ error: { mark: 'has-error' } });

      control.aspect(InValidation).by(trackValue({ invalid: true }));

      expect(await control.aspect(InCssClasses).read).toMatchObject({ 'has-error': true });
    });
    it('reflects form info by default', async () => {

      const [{ control: formCtl, element: formElt }] = await bootstrap();

      formCtl.aspect(InMode).own.it = 'off';

      const formCtlCss = trackValueBy(formCtl.aspect(InCssClasses));
      const formEltCss = trackValueBy(formElt.aspect(InCssClasses));

      expect(formCtlCss.it).toMatchObject({ 'disabled@inasp': true });
      expect(formEltCss.it).toMatchObject({ 'disabled@inasp': true });
    });
    it('reflects field info by default', async () => {

      const [, { control }] = await bootstrap();

      control.aspect(InMode).own.it = 'off';

      expect(await control.aspect(InCssClasses).read).toMatchObject({ 'disabled@inasp': true });
    });
    it('reflects customized field info', async () => {

      const [, { control }] = await bootstrap({ info: { ns: DEFAULT__NS } });

      control.aspect(InMode).own.it = 'off';

      expect(await control.aspect(InCssClasses).read).toMatchObject({ disabled: true });
    });
    it('does not reflect form validity when disabled', async () => {

      const [{ control: formCtl, element: formElt }] = await bootstrap({ error: false, info: false });

      formCtl.aspect(InMode).own.it = 'off';

      const formCtlCss = trackValueBy(formCtl.aspect(InCssClasses));
      const formEltCss = trackValueBy(formElt.aspect(InCssClasses));

      expect(formCtlCss.it).toEqual({});
      expect(formEltCss.it).toEqual({});
    });
    it('does not reflect field validity when disabled', async () => {

      const [, { control }] = await bootstrap({ error: false, info: false });

      control.aspect(InValidation).by(trackValue({ invalid: true }));

      expect(await control.aspect(InCssClasses).read).toEqual({});
    });

    async function bootstrap(options?: FormCssPreset.Options): Promise<[form: Form, field: Field<string>]> {

      @Component(
          'test-form',
          {
            extend: { type: MockElement },
            feature: {
              needs: options ? [] : FormCssPreset,
              setup: setup => {
                if (options) {
                  setup.provide(new FormCssPreset(options));
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
});
