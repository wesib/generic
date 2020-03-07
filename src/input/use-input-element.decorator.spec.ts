import { bootstrapComponents, ComponentMount } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterThe, eventSupply, eventSupplyOf } from 'fun-events';
import { InControl, InElement, inText } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl } from './input-from-control';
import { UseInputElement, UseInputElementDef } from './use-input-element.decorator';

describe('input', () => {
  describe('@UseInputElement', () => {

    let element: Element;
    let input: HTMLInputElement;

    beforeEach(() => {
      element = document.body.appendChild(document.createElement('custom-element'));
      input = element.appendChild(document.createElement('input'));
    });
    afterEach(() => {
      element.remove();
    });

    it('uses <input> element by default', async () => {

      const { context } = await bootstrap({
        makeControl: ({ node }) => inText(node.element),
      });

      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeInstanceOf(InElement);
            expect(control!.aspect(InElement)!.element).toBe(input);
          },
      );
    });
    it('does not use non-matching element', async () => {

      const { context } = await bootstrap({
        pick: { all: false },
        makeControl: ({ node }) => inText(node.element),
      });

      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('does not use element if control is not constructed', async () => {

      const { context } = await bootstrap({
        makeControl: noop,
      });

      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('detaches unused control', async () => {

      const { context } = await bootstrap({
        makeControl: ({ node }) => inText(node.element),
      });

      let ctrl!: InControl<any>;

      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => ctrl = control!,
      );

      input.remove();
      await Promise.resolve();

      expect(eventSupplyOf(ctrl).isOff).toBe(true);
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('cuts off provided supply when control unused', async () => {

      const supply = eventSupply();
      const { context } = await bootstrap({
        makeControl: ({ node }) => afterThe(inText(node.element), supply),
      });

      let ctrl!: InControl<any>;

      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => ctrl = control!,
      );

      input.remove();
      await Promise.resolve();

      expect(eventSupplyOf(ctrl).isOff).toBe(false);
      expect(supply.isOff).toBe(true);
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });

    async function bootstrap(def: UseInputElementDef): Promise<ComponentMount> {

      @UseInputElement(def)
      class TestElement {}

      const bsContext = await bootstrapComponents(TestElement).whenReady;
      const factory = await bsContext.whenDefined(TestElement);

      return factory.mountTo(element);
    }
  });
});
