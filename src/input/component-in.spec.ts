import { bootstrapComponents, BootstrapContext, Component, ComponentContext } from '@wesib/wesib';
import { nextArgs } from 'call-thru';
import { afterThe, eventSupply, EventSupply, trackValue, ValueTracker } from 'fun-events';
import { InControl, InValidation, inValue } from 'input-aspects';
import { ComponentIn } from './component-in';
import { ComponentInControl } from './component-in-control';
import { ComponentInReceiver } from './component-in-receiver';

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

        await new Promise(resolve => bsContext.load(ParticipatingComponent).read(({ ready }) => ready && resolve()));

        const factory = await bsContext.whenDefined(ParticipatingComponent);

        participantElement = inputElement.appendChild(document.createElement('input-participant'));

        factory.mountTo(participantElement);
      });

      let inputControl: InControl<string>;

      beforeEach(() => {
        inputControl = inValue('abc');
      });

      it('discovers input participants', () => {

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        expect(mockIn).toHaveBeenCalledWith(expect.objectContaining({
          receiver: inputContext.get(ComponentInReceiver),
          control: inputControl,
        }));
        expect(mockIn).toHaveBeenCalledTimes(1);
        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error]),
        );
      });
      it('disables input participation when component input disabled', () => {

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        inSupply.off();
        inputControl.aspect(InValidation).read.once(
            result => expect(result.has()).toBe(false),
        );
      });
      it('disables input participation when participating component removed', async () => {

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        participantElement.remove();
        await Promise.resolve();

        inputControl.aspect(InValidation).read.once(
            result => expect(result.has()).toBe(false),
        );
      });
      it('ignores non-participating component', async () => {

        @Component({})
        class NestedComponent {}

        await new Promise(resolve => bsContext.load(NestedComponent).read(({ ready }) => ready && resolve()));

        const factory = await bsContext.whenDefined(NestedComponent);
        const nestedElement = participantElement.appendChild(document.createElement('nested-component'));

        factory.mountTo(nestedElement);

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error]),
        );

        nestedElement.remove();
        await Promise.resolve();

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error]),
        );
      });
      it('ignores nested participating component', async () => {

        const nestedIn = jest.fn();

        @Component({
          setup(setup) {
            setup.perComponent({
              a: ComponentIn,
              is: afterThe(nestedIn),
            });
          },
        })
        class NestedComponent {}

        await new Promise(resolve => bsContext.load(NestedComponent).read(({ ready }) => ready && resolve()));

        const factory = await bsContext.whenDefined(NestedComponent);
        const nestedElement = participantElement.appendChild(document.createElement('nested-component'));
        await Promise.resolve();

        factory.mountTo(nestedElement);

        const error: InValidation.Message = { invalid: 'error' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        expect(nestedIn).not.toHaveBeenCalled();
        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error]),
        );
      });
      it('handles participating component moved inside another one', async () => {

        const error1: InValidation.Message = { invalid: 'error 1' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error1)).needs(inSupply),
        );

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        const error2: InValidation.Message = { invalid: 'error 2' };

        @Component({
          setup(setup) {
            setup.perComponent({
              a: ComponentIn,
              is: afterThe<ComponentIn.Participant[]>(
                  ctx => ctx.control.aspect(InValidation).by(afterThe(error2)),
              ),
            });
          },
        })
        class NestedComponent {}

        await new Promise(resolve => bsContext.load(NestedComponent).read(({ ready }) => ready && resolve()));

        const factory = await bsContext.whenDefined(NestedComponent);
        const nestedElement = inputElement.appendChild(document.createElement('nested-component'));
        await Promise.resolve();

        factory.mountTo(nestedElement);

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error1, error2]),
        );

        participantElement.appendChild(nestedElement);
        await Promise.resolve();

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error1]),
        );
      });
      it('handles participating component become nested inside another one', async () => {

        const error1: InValidation.Message = { invalid: 'error 1' };
        const mockIn = jest.fn<EventSupply, Parameters<ComponentIn.Participant>>(
            ctx => ctx.control.aspect(InValidation).by(afterThe(error1)).needs(inSupply),
        );

        const error2: InValidation.Message = { invalid: 'error 2' };

        @Component({
          setup(setup) {
            setup.perComponent({
              a: ComponentIn,
              is: afterThe<ComponentIn.Participant[]>(
                  ctx => ctx.control.aspect(InValidation).by(afterThe(error2)),
              ),
            });
          },
        })
        class NestedComponent {}

        await new Promise(resolve => bsContext.load(NestedComponent).read(({ ready }) => ready && resolve()));

        const factory = await bsContext.whenDefined(NestedComponent);
        const enclosingElement = inputElement.appendChild(document.createElement('enclosing-component'));

        enclosingElement.appendChild(participantElement);
        await Promise.resolve();

        participants.it = [mockIn];
        componentInControl.enable(inputControl);

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error1]),
        );

        factory.mountTo(enclosingElement);

        inputControl.aspect(InValidation).read.once(
            result => expect(result.messages('invalid')).toEqual([error2]),
        );
      });
    });
  });
});
