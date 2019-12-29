import {
  bootstrapComponents,
  BootstrapContext,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentFactory,
} from '@wesib/wesib';
import { EventSupply } from 'fun-events';
import { InControl, InValidation, inValue, requirePresent } from 'input-aspects';
import { ComponentInControl } from './component-in-control';
import { ComponentInValidity } from './component-in-validity';

describe('input', () => {
  describe('ComponentInValidity', () => {

    let inputElement: Element;

    beforeEach(() => {
      inputElement = document.body.appendChild(document.createElement('input-component'));
    });
    afterEach(() => {
      inputElement.remove();
    });

    let bsContext: BootstrapContext;
    let inputContext: ComponentContext;
    let componentInControl: ComponentInControl;

    beforeEach(async () => {

      @Component(ComponentInControl)
      class InputComponent {}

      bsContext = await new Promise<BootstrapContext>(
          resolve => bootstrapComponents(InputComponent).whenReady(resolve),
      );
      const factory = await bsContext.whenDefined(InputComponent);

      inputContext = factory.mountTo(inputElement).context;
      componentInControl = inputContext.get(ComponentInControl);
    });

    let inputControl: InControl<string>;
    beforeEach(() => {

      inputControl = inValue('abc');
    });

    let componentInValidity: ComponentInValidity;
    let validityElement: Element;
    let inSupply: EventSupply;

    beforeEach(async () => {

      @Component(ComponentInValidity)
      class ValidityComponent {}

      const factory = await loadComponent(ValidityComponent);

      validityElement = inputElement.appendChild(document.createElement('input-validity'));
      await Promise.resolve();

      componentInValidity = factory.mountTo(validityElement).context.get(ComponentInValidity);
      inSupply = componentInControl.in(inputControl);
    });

    it('reports no errors by default', () => {
      expectNoErrors();
    });
    it('reports validation errors', () => {
      inputControl.aspect(InValidation).by(requirePresent());
      inputControl.it = '';
      componentInValidity.once(result => {
        expect(result.has('missing')).toBe(true);
      });
    });
    it('drops validation errors when input is disabled', () => {
      inputControl.aspect(InValidation).by(requirePresent());
      inputControl.it = '';
      inSupply.off();
      expectNoErrors();
    });
    it('drops validation errors when validity component is removed', async () => {
      validityElement.remove();
      await Promise.resolve();
      expectNoErrors();
    });

    async function loadComponent<T extends object>(
        componentType: ComponentClass<T>,
    ): Promise<ComponentFactory<T>> {
      await new Promise(resolve => bsContext.load(componentType).read(({ ready }) => ready && resolve()));
      return bsContext.whenDefined(componentType);
    }

    function expectNoErrors() {
      componentInValidity.once(result => {
        expect(result.has()).toBe(false);
      });
    }

  });
});
