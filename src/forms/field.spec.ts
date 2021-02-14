import { inValue } from '@frontmeans/input-aspects';
import { Field } from './field';

describe('forms', () => {
  describe('Field', () => {

    let field: Field<string>;

    beforeEach(() => {
      field = new Field({ control: inValue('test') });
    });

    describe('control', () => {
      it('throws before bound to sharer context', () => {
        expect(() => field.control).toThrow(TypeError);
      });
    });

    describe('sharer', () => {
      it('throws before bound to sharer context', () => {
        expect(() => field.sharer).toThrow(TypeError);
      });
    });

  });
});
