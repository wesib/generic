import { inFormElement, InGroup, inGroup } from '@proc7ts/input-aspects';
import { noop } from '@proc7ts/primitives';
import { bootstrapComponents, ComponentMount } from '@wesib/wesib';
import { FillInputForm, FillInputFormDef } from './fill-input-form.decorator';
import { InputToForm } from './input-to-form';
import { OnSubmit, OnSubmitDef } from './on-submit.decorator';

describe('input', () => {
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
            form: expect.objectContaining({ element: expect.objectContaining({ tagName: 'FORM' }) }),
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

    async function bootstrap(
        onSubmit: (inputToForm: InputToForm<TestData>) => void,
        def?: OnSubmitDef,
        formDef: FillInputFormDef<TestData> = {
          makeForm({ node, aspects }) {

            const group = inGroup<TestData>({}, { aspects });

            return [group, inFormElement(node.element, { form: group })];
          },
        },
    ): Promise<ComponentMount> {

      @FillInputForm(formDef)
      class TestElement {

        @OnSubmit(def)
        readonly onSubmit = onSubmit;

      }

      const bsContext = await bootstrapComponents(TestElement).whenReady();
      const defContext = await bsContext.whenDefined(TestElement);

      return defContext.mountTo(element);
    }
  });
});
