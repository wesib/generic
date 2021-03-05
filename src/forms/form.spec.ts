import { inFormElement, inGroup, inValue } from '@frontmeans/input-aspects';
import { Contextual__symbol } from '@proc7ts/context-values';
import { trackValue } from '@proc7ts/fun-events';
import { Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { MockElement, testElement } from '../spec/test-element';
import { Form } from './form';

describe('forms', () => {
  describe('Form', () => {

    let form: Form;

    beforeEach(() => {
      form = new Form(Form.forElement(inGroup({}), document.createElement('form')));
    });

    describe('controls', () => {

      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          extend: { type: MockElement },
        })
        class TestComponent {
        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
      });

      it('de-duplicated', () => {

        const controls = trackValue<Form.Controls<string>>();

        form = new Form(() => controls.read);

        const control1 = inValue('test');
        const element1 = inFormElement(document.createElement('form'), { form: control1 });

        controls.it = { control: control1, element: element1 };

        form[Contextual__symbol](context);

        expect(form.control).toBe(control1);
        expect(form.element).toBe(element1);
        expect(control1.supply.isOff).toBe(false);
        expect(element1.supply.isOff).toBe(false);

        const element2 = inFormElement(document.createElement('form'), { form: control1 });

        controls.it = { control: control1, element: element2 };
        expect(form.control).toBe(control1);
        expect(form.element).toBe(element2);
        expect(control1.supply.isOff).toBe(false);
        expect(element1.supply.isOff).toBe(true);

        const control2 = inValue('test2');

        controls.it = { control: control2, element: element2 };
        expect(form.control).toBe(control2);
        expect(form.element).toBe(element2);
        expect(control2.supply.isOff).toBe(false);
        expect(element1.supply.isOff).toBe(true);

        controls.it = undefined;
        expect(form.control).toBeUndefined();
        expect(form.element).toBeUndefined();
        expect(control2.supply.isOff).toBe(true);
        expect(element2.supply.isOff).toBe(true);
      });
    });

    describe('control', () => {
      it('throws before bound to sharer context', () => {
        expect(() => form.control).toThrow(TypeError);
      });
    });

    describe('element', () => {
      it('throws before bound to sharer context', () => {
        expect(() => form.element).toThrow(TypeError);
      });
    });

    describe('sharer', () => {
      it('throws before bound to sharer context', () => {
        expect(() => form.sharer).toThrow(TypeError);
      });
    });

    describe('aspect', () => {
      it('is `null` by default', () => {
        expect(inValue('test').aspect(Form)).toBeNull();
      });
    });

  });
});
