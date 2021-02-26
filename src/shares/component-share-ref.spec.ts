import { noop } from '@proc7ts/primitives';
import { ComponentShare } from './component-share';
import { ComponentShare__symbol, isComponentShareRef } from './component-share-ref';

describe('shares', () => {
  describe('isComponentShareRef', () => {
    it('returns `true` for component share reference', () => {

      const share = new ComponentShare('test');

      expect(isComponentShareRef(share)).toBe(true);
    });
    it('returns `true` for function with `[ComponentShare__symbol]` property', () => {

      const ref = noop as (() => void) & { [ComponentShare__symbol]: ComponentShare<string> };

      ref[ComponentShare__symbol] = new ComponentShare('test');

      expect(isComponentShareRef(ref)).toBe(true);
    });
    it('returns `false` for `null` value', () => {
      expect(isComponentShareRef(null)).toBe(false);
    });
    it('returns `false` for string', () => {
      expect(isComponentShareRef('some')).toBe(false);
    });
  });
});
