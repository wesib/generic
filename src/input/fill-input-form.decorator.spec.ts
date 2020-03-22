import { noop } from '@proc7ts/call-thru';
import { afterThe, eventSupply, eventSupplyOf } from '@proc7ts/fun-events';
import { InControl, InElement, InFormElement, inFormElement, InGroup, inGroup } from '@proc7ts/input-aspects';
import { bootstrapComponents, ComponentMount } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { FillInputForm, FillInputFormDef } from './fill-input-form.decorator';
import { InputFromControl } from './input-from-control';
import { InputToForm } from './input-to-form';

describe('input', () => {
  describe('@FillInputForm', () => {

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

    it('fills <form> element by default', async () => {

      const { context } = await bootstrap();

      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            expect(control).toBeInstanceOf(InGroup);
            expect(form).toBeInstanceOf(InElement);
            expect(form!.element).toBe(formElement);
          },
      );
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeInstanceOf(InGroup);
          },
      );
    });
    it('does not fill non-matching element', async () => {

      const { context } = await bootstrap({
        pick: { all: false },
        makeForm({ node }) {

          const group = inGroup<TestData>({});

          return [group, inFormElement(node.element, { form: group })];
        },
      });

      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            expect(control).toBeUndefined();
            expect(form).toBeUndefined();
          },
      );
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('does not fill form if control is not constructed', async () => {

      const { context } = await bootstrap({
        makeForm: noop,
      });

      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            expect(control).toBeUndefined();
            expect(form).toBeUndefined();
          },
      );
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('detaches unused form', async () => {

      const { context } = await bootstrap();

      let ctrl!: InControl<any>;
      let formCtrl!: InFormElement;

      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            ctrl = control!;
            formCtrl = form!;
          },
      );

      formElement.remove();
      await Promise.resolve();

      expect(eventSupplyOf(ctrl).isOff).toBe(true);
      expect(eventSupplyOf(formCtrl).isOff).toBe(true);
      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            expect(control).toBeUndefined();
            expect(form).toBeUndefined();
          },
      );
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });
    it('cuts off provided supply when control unused', async () => {

      const supply = eventSupply();
      const { context } = await bootstrap({
        makeForm: ({ node }) => {

          const group = inGroup<TestData>({});

          return afterThe(group, inFormElement(node.element, { form: group }), supply);
        },
      });

      let ctrl!: InControl<any>;
      let formCtrl!: InFormElement;

      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            ctrl = control!;
            formCtrl = form!;
          },
      );

      formElement.remove();
      await Promise.resolve();

      expect(eventSupplyOf(ctrl).isOff).toBe(false);
      expect(eventSupplyOf(formCtrl).isOff).toBe(false);
      expect(supply.isOff).toBe(true);
      context.get(HierarchyContext).get(InputToForm).once(
          ({ control, form }) => {
            expect(control).toBeUndefined();
            expect(form).toBeUndefined();
          },
      );
      context.get(HierarchyContext).get(InputFromControl).once(
          ({ control }) => {
            expect(control).toBeUndefined();
          },
      );
    });

    async function bootstrap(def: FillInputFormDef = {
      makeForm({ node, aspects }) {

        const group = inGroup<TestData>({}, { aspects });

        return [group, inFormElement(node.element, { form: group })];
      },
    }): Promise<ComponentMount> {

      @FillInputForm(def)
      class TestElement {}

      const bsContext = await bootstrapComponents(TestElement).whenReady();
      const factory = await bsContext.whenDefined(TestElement);

      return factory.mountTo(element);
    }
  });
});
