import {
  bootstrapComponents,
  BootstrapContext,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentFactory,
} from '@wesib/wesib';
import { nextArgs } from 'call-thru';
import { afterThe, eventSupply, EventSupply, trackValue, ValueTracker } from 'fun-events';
import { InControl, InValidation, inValue } from 'input-aspects';
import { ComponentIn } from './component-in';
import { ComponentInControl } from './component-in-control';
import { ComponentInReceiver } from './component-in-receiver';
import Mock = jest.Mock;

describe('input', () => {
  describe('ComponentIn', () => {

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
      class InputComponent {
      }

      bsContext = await new Promise<BootstrapContext>(
          resolve => bootstrapComponents(InputComponent).whenReady(resolve),
      );
      const factory = await bsContext.whenDefined(InputComponent);

      inputContext = factory.mountTo(inputElement).context;
      componentInControl = inputContext.get(ComponentInControl);
    });

    describe('ComponentIn', () => {

      let participantElement: Element;
      let inSupply: EventSupply;
      let participants: ValueTracker<ComponentIn.Participant[]>;

      beforeEach(async () => {
        inSupply = eventSupply();
        participants = trackValue([]);

        @Component({
          setup(setup) {
            setup.perComponent({
              a: ComponentIn,
              is: participants.read
                  .tillOff(inSupply)
                  .keep.thru(
                      ins => nextArgs(...ins),
                  ),
            });
          },
        })
        class ParticipatingComponent {
        }

        const factory = await loadComponent(ParticipatingComponent);

        participantElement = inputElement.appendChild(document.createElement('input-participant'));

        factory.mountTo(participantElement);
      });

      let inputControl: InControl<string>;

      beforeEach(() => {
        inputControl = inValue('abc');
      });

      it('discovers input participants', () => {

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = participateByError(error);

        componentInControl.in(inputControl);

        expect(mockIn).toHaveBeenCalledWith(expect.objectContaining({
          receiver: inputContext.get(ComponentInReceiver),
          control: inputControl,
        }));
        expect(mockIn).toHaveBeenCalledTimes(1);
        expectErrors('invalid', error);
      });
      it('disables input participation when component input disabled', () => {

        const error: InValidation.Message = { invalid: 'error' };

        participateByError(error);
        componentInControl.in(inputControl);

        inSupply.off();
        expectNoErrors();
      });
      it('disables input participation when participating component removed', async () => {

        const error: InValidation.Message = { invalid: 'error' };

        participateByError(error);
        componentInControl.in(inputControl);

        participantElement.remove();
        await Promise.resolve();
        expectNoErrors();
      });
      it('ignores non-participating component', async () => {

        @Component()
        class NestedComponent {}

        const factory = await loadComponent(NestedComponent);
        const nestedElement = participantElement.appendChild(document.createElement('nested-component'));

        factory.mountTo(nestedElement);

        const error: InValidation.Message = { invalid: 'error' };

        participateByError(error);
        componentInControl.in(inputControl);

        expectErrors('invalid', error);

        nestedElement.remove();
        await Promise.resolve();

        expectErrors('invalid', error);
      });
      it('discovers nested input participant', async () => {

        const nestedError: InValidation.Message = { invalid: 'nested-error' };
        const [factory, nestedIn] = await errorParticipant(nestedError);
        const nestedElement = participantElement.appendChild(document.createElement('nested-component'));
        await Promise.resolve();

        factory.mountTo(nestedElement);

        const error: InValidation.Message = { invalid: 'error' };

        participateByError(error);
        componentInControl.in(inputControl);

        expect(nestedIn).toHaveBeenCalled();
        expectErrors('invalid', error, nestedError);
      });
      it('ignores input participant nested inside another input target', async () => {

        const nestedError: InValidation.Message = { invalid: 'nested-error' };
        const [nestedFactory, nestedIn] = await nestedInControl(nestedError);

        const nestedElement = participantElement.appendChild(document.createElement('nested-input'));
        await Promise.resolve();
        nestedFactory.mountTo(nestedElement);

        const deepNestedError: InValidation.Message = { invalid: 'deep-nested-error' };
        const [deepNestedFactory, deepNestedIn] = await errorParticipant(deepNestedError);
        const deepNestedElement = nestedElement.appendChild(document.createElement('deep-nested-component'));
        await Promise.resolve();
        deepNestedFactory.mountTo(deepNestedElement);

        const error: InValidation.Message = { invalid: 'error' };

        participateByError(error);
        componentInControl.in(inputControl);

        expect(nestedIn).toHaveBeenCalled();
        expect(deepNestedIn).not.toHaveBeenCalled();
        expectErrors('invalid', error, nestedError);
      });
      it('discovers input participant moved inside another one', async () => {

        const error1: InValidation.Message = { invalid: 'error 1' };

        participateByError(error1);

        componentInControl.in(inputControl);

        const error2: InValidation.Message = { invalid: 'error 2' };
        const [factory] = await errorParticipant(error2);
        const nestedElement = inputElement.appendChild(document.createElement('nested-component'));

        await Promise.resolve();

        factory.mountTo(nestedElement);
        expectErrors('invalid', error1, error2);

        participantElement.appendChild(nestedElement);
        await Promise.resolve();

        expectErrors('invalid', error1, error2);
      });
      it('discovers input participant become nested inside another one', async () => {

        const error1: InValidation.Message = { invalid: 'error 1' };

        participateByError(error1);

        const error2: InValidation.Message = { invalid: 'error 2' };
        const [factory] = await errorParticipant(error2);
        const enclosingElement = inputElement.appendChild(document.createElement('enclosing-component'));

        enclosingElement.appendChild(participantElement);
        await Promise.resolve();

        componentInControl.in(inputControl);
        expectErrors('invalid', error1);

        factory.mountTo(enclosingElement);
        expectErrors('invalid', error1, error2);
      });

      function inErrorMock(...errors: InValidation.Message[]): Mock<EventSupply, Parameters<ComponentIn.Participant>> {
        return jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            participation => participation.control.aspect(InValidation).by(afterThe(...errors)).needs(inSupply),
        );
      }

      function participateByError(
          ...errors: InValidation.Message[]
      ): Mock<EventSupply, Parameters<ComponentIn.Participant>> {

        const mockIn = inErrorMock(...errors);

        participants.it = [mockIn];

        return mockIn;
      }

      async function errorParticipant(
          ...errors: InValidation.Message[]
      ): Promise<[ComponentFactory, Mock<EventSupply, Parameters<ComponentIn.Participant>>]> {

        const mockIn = inErrorMock(...errors);

        @Component({
          setup(setup) {
            setup.perComponent({
              a: ComponentIn,
              is: afterThe<ComponentIn.Participant[]>(mockIn),
            });
          },
        })
        class ErrorComponent {}

        return [await loadComponent(ErrorComponent), mockIn];
      }

      async function nestedInControl(
          ...errors: InValidation.Message[]
      ): Promise<[ComponentFactory, Mock<EventSupply, Parameters<ComponentIn.Participant>>]> {

        const mockIn = inErrorMock(...errors);

        @Component(
            ComponentInControl,
            {
              setup(setup) {
                setup.perComponent({
                  a: ComponentIn,
                  is: afterThe<ComponentIn.Participant[]>(mockIn),
                });
              },
            },
        )
        class NestedInControl {}

        return [await loadComponent(NestedInControl), mockIn];
      }

      async function loadComponent<T extends object>(
          componentType: ComponentClass<T>,
      ): Promise<ComponentFactory<T>> {
        await new Promise(resolve => bsContext.load(componentType).read(({ ready }) => ready && resolve()));
        return bsContext.whenDefined(componentType);
      }

      function expectNoErrors() {
        inputControl.aspect(InValidation).read.once(
            result => expect(result.has()).toBe(false),
        );
      }

      function expectErrors(code: string | undefined, ...errors: InValidation.Message[]) {
        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages(code)).toEqual(errors),
        );
      }
    });
  });
});
