import { inValue } from '@frontmeans/input-aspects';
import { Field } from './field';

describe('forms', () => {
  describe('control', () => {
    it('throws before bound to sharer context', () => {

      const field = new Field(inValue('test'));

      expect(() => field.control).toThrow(TypeError);
    });
  });
});
