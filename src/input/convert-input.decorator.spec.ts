import { bootstrapComponents, Component, ComponentContext, ComponentMount } from '@wesib/wesib';
import { afterSupplied, EventEmitter, eventSupply, EventSupply, trackValue } from 'fun-events';
import { InControl, InStyledElement, InSupply, inValue } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';
import { ConvertInput, ConvertInputDef } from './convert-input.decorator';
import { InputFromControl, inputFromControl, NoInputFromControl } from './input-from-control';

describe('input', () => {
  describe('@ConvertInput', () => {

    let root: Element;
    let element: Element;

    beforeEach(() => {
      root = document.body.appendChild(document.createElement('root-input'));
      element = root.appendChild(document.createElement('converted-input'));
    });
    afterEach(() => {
      root.remove();
    });

    let rootControl: InControl<string>;

    beforeEach(() => {
      rootControl = inValue('test');
    });

    it('converts enclosing input control', async () => {

      const [{ control }] = await bootstrap(
          ({ control, aspects }) => control.control.convert(
              InStyledElement.to(element),
              aspects,
          ),
      );

      expect(control?.aspect(InStyledElement)).toBe(element);
    });
    it('does not convert enclosing input control when nothing returned', async () => {

      const [{ control }] = await bootstrap(
          () => null,
      );

      expect(control).toBe(rootControl);
    });
    it('converts enclosing input control when keeper returned', async () => {

      const converted = inValue('converted');
      const converter = trackValue(converted);
      const [{ control }] = await bootstrap(
          () => converter,
      );

      expect(control).toBe(converted);
    });
    it('detaches unused converted control', async () => {

      const converted = inValue('converted');
      const converter = trackValue<InControl<any> | undefined>(converted);

      await bootstrap(
          () => converter,
      );

      converter.it = undefined;

      expect(converted.aspect(InSupply).isOff).toBe(true);
    });
    it('cuts off provided supply when control unused', async () => {

      const converted = inValue('converted');
      const supply = eventSupply();
      const converter = new EventEmitter<[InControl<any>?, EventSupply?]>();

      await bootstrap(
          () => afterSupplied<[InControl<any>?, EventSupply?]>(
              converter,
              () => [converted, supply],
          ),
      );

      converter.send();

      expect(supply.isOff).toBe(true);
      expect(converted.aspect(InSupply).isOff).toBe(false);
    });

    async function bootstrap(
        convert: ConvertInputDef,
    ): Promise<[InputFromControl | NoInputFromControl, ComponentMount]> {

      @Component()
      class RootInput {

        constructor(context: ComponentContext) {
          inputFromControl(context, rootControl);
        }

      }

      @ConvertInput(convert)
      class ConvertedInput {}

      const bsContext = await new Promise(
          bootstrapComponents(RootInput, ConvertedInput).whenReady,
      );
      const [rootFactory, factory] = await Promise.all(([
        bsContext.whenDefined(RootInput),
        bsContext.whenDefined(ConvertedInput),
      ]));

      rootFactory.mountTo(root);

      const mount = factory.mountTo(element);
      const control = await new Promise<InputFromControl | NoInputFromControl>(
          resolve => mount.context.get(HierarchyContext).get(InputFromControl).once(resolve),
      );

      return [control as InputFromControl, mount];
    }
  });
});
