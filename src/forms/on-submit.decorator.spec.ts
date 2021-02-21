import { inFormElement, InGroup, inGroup } from '@frontmeans/input-aspects';
import { afterThe } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Component, ComponentMount } from '@wesib/wesib';
import { testDefinition } from '../spec/test-element';
import { Form } from './form';
import { OnSubmit, OnSubmitDef } from './on-submit.decorator';
import { SharedForm, SharedFormDef } from './shared-form.decorator';

describe('forms', () => {
  describe('@OnSubmit', () => {

    interface TestData {
      property?: string;
    }

    let element: Element;
    let formElement: HTMLFormElement;

    beforeEach(() => {
      element = document.body.appendChild(document.createElement('custom-element'));
      formElement = element.appendChild(document.createElement('form'));
    });
    afterEach(() => {
      element.remove();
    });

    it('calls decorated method on submit', async () => {

      const onSubmit = jest.fn();

      await bootstrap(onSubmit);

      formElement.requestSubmit();
      expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            control: expect.any(InGroup),
            element: expect.objectContaining({ element: expect.objectContaining({ tagName: 'FORM' }) }),
          }),
          expect.objectContaining({
            type: 'submit',
          }),
      );
    });
    it('cancels default event handler by default', async () => {
      await bootstrap(noop);

      const submit = new Event('submit', { cancelable: true });

      expect(formElement.dispatchEvent(submit)).toBe(false);
    });
    it('does not cancel default event handler when `cancel` is `false`', async () => {
      await bootstrap(noop, { cancel: false });

      const submit = new Event('submit', { cancelable: true });

      expect(formElement.dispatchEvent(submit)).toBe(true);
    });
    it('does not submit when there is no form', async () => {

      const defaultSubmit = jest.fn(e => e.preventDefault());

      formElement.addEventListener('submit', defaultSubmit);

      const onSubmit = jest.fn();

      await bootstrap(onSubmit, { form: () => afterThe() });
      formElement.requestSubmit();
      expect(defaultSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'submit' }));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    async function bootstrap(
        onSubmit: (form: Form<TestData>, event: Event) => void,
        def?: OnSubmitDef,
        formDef?: SharedFormDef<Form<TestData>>,
    ): Promise<ComponentMount> {

      @Component('custom-element')
      class TestElement {

        @SharedForm(formDef)
        form = Form.by<TestData>(
            opts => inGroup({}, opts),
            opts => inFormElement(formElement, opts),
        );

        @OnSubmit(def)
        readonly onSubmit = onSubmit;

      }

      const defContext = await testDefinition(TestElement);

      return defContext.mountTo(element);
    }
  });
});
