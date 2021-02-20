import { inGroup, inValue } from '@frontmeans/input-aspects';
import { Form } from './form';

describe('forms', () => {
  describe('Form', () => {

    let form: Form;

    beforeEach(() => {
      form = new Form(Form.forElement(inGroup({}), document.createElement('form')));
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
