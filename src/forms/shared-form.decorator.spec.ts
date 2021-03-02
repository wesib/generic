import { InElement, inFormElement, inGroup } from '@frontmeans/input-aspects';
import { mapAfter, trackValue } from '@proc7ts/fun-events';
import { Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { MockElement, testElement } from '../spec/test-element';
import { Form } from './form';
import { FormShare } from './form.share';
import { SharedForm } from './shared-form.decorator';

describe('forms', () => {
  describe('@SharedForm', () => {
    it('shares form', async () => {

      const hasControls = trackValue(false);

      @Component('test-element', { extend: { type: MockElement } })
      class TestComponent {

        @SharedForm()
        readonly form: Form;

        constructor(context: ComponentContext) {
          this.form = new Form<any>(builder => {

            const control = builder.control.build(opts => inGroup({}, opts));

            return hasControls.read.do(
                mapAfter(has => has
                    ? {
                      control,
                      element: builder.element.build(opts => inFormElement(
                          context.element,
                          {
                            ...opts,
                            form: control,
                          },
                      )),
                    }
                    : undefined),
            );
          });
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const form = await context.get(FormShare);

      expect(form).toBeInstanceOf(Form);
      expect(form?.control).toBeUndefined();
      expect(form?.element).toBeUndefined();

      hasControls.it = true;
      expect(form?.control?.aspect(Form)).toBe(form);
      expect(form?.element).toBeInstanceOf(InElement);

      const controls = await form?.readControls;

      expect(controls).toEqual({
        control: form?.control,
        element: form?.element,
      });
    });
  });
});
