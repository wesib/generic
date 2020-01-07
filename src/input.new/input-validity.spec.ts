import { bootstrapComponents, BootstrapContext, Component, ComponentContext } from '@wesib/wesib';
import { afterThe } from 'fun-events';
import { InControl, InValidation, inValue } from 'input-aspects';
import { inputFromControl } from './input-from-control';
import { inputValidity } from './input-validity';

describe('input', () => {
  describe('InputValidity', () => {

    let inputElement: Element;
    let errorElement: Element;

    beforeEach(() => {
      inputElement = document.body.appendChild(document.createElement('input-element'));
      errorElement = inputElement.appendChild(document.createElement('error-element'));
    });
    afterEach(() => {
      inputElement.remove();
    });

    let inputContext: ComponentContext;
    let errorContext: ComponentContext;

    beforeEach(async () => {

      @Component()
      class TestComponent {}

      const bsContext = await new Promise<BootstrapContext>(
          resolve => bootstrapComponents(TestComponent).whenReady(resolve),
      );
      const factory = await bsContext.whenDefined(TestComponent);

      inputContext = factory.mountTo(inputElement).context;
      errorContext = factory.mountTo(errorElement).context;
    });

    let control: InControl<string>;

    beforeEach(() => {
      control = inValue('test');
      inputFromControl(inputContext, control);
      inputValidity(inputContext);
    });

    let validationResult: InValidation.Result;

    beforeEach(() => {
      inputValidity(errorContext)(result => validationResult = result);
    });

    it('is empty by default', () => {
      expect(validationResult.ok).toBe(true);
    });
    it('reflects validation errors', () => {

      const error: InValidation.Message = {
        invalid: 'error',
      };

      control.aspect(InValidation).by(afterThe(error));

      expect(validationResult.messages('invalid')).toEqual([error]);
    });
    it('drops validation messages once disconnected', async () => {

      const error: InValidation.Message = {
        invalid: 'error',
      };

      control.aspect(InValidation).by(afterThe(error));
      errorContext.mount!.connected = false;
      await Promise.resolve();

      expect(validationResult.ok).toBe(true);
    });
  });
});
