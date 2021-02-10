import { noop } from '@proc7ts/primitives';
import { ComponentContext } from '@wesib/wesib';
import { isShareableByComponent, ShareableByComponent, ShareableByComponent__symbol } from './shareable-by-component';

describe('share', () => {
  describe('isShareableByComponent', () => {
    it('returns `false` for `null` value', () => {
      expect(isShareableByComponent(null)).toBe(false);
    });
    it('returns `false` for numeric value', () => {
      expect(isShareableByComponent(123)).toBe(false);
    });
    it('returns `false` for string value', () => {
      expect(isShareableByComponent('123')).toBe(false);
    });
    it('returns `false` for function', () => {
      expect(isShareableByComponent(noop)).toBe(false);
    });
    it('returns `false` for object', () => {
      expect(isShareableByComponent({})).toBe(false);
    });
    it('returns `false` for object with non-method [ShareableByComponent__symbol] property', () => {
      expect(isShareableByComponent({ [ShareableByComponent__symbol]: 1 })).toBe(false);
    });
    it('returns `true` for shareable instance', () => {

      interface TestShareable extends ShareableByComponent.Base<TestShareable> {
        [ShareableByComponent__symbol](_context: ComponentContext): TestShareable;
      }

      const value: TestShareable = {
        [ShareableByComponent__symbol](_context: ComponentContext): TestShareable {
          return this;
        },
      };

      expect(isShareableByComponent(value)).toBe(true);
    });
  });
});
