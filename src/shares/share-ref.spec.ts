import { describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { Share } from './share';
import { isShareRef, Share__symbol } from './share-ref';

describe('shares', () => {
  describe('isShareRef', () => {
    it('returns `true` for component share reference', () => {

      const share = new Share('test');

      expect(isShareRef(share)).toBe(true);
    });
    it('returns `true` for function with `[Share__symbol]` property', () => {

      const ref = noop as (() => void) & { [Share__symbol]: Share<string> };

      ref[Share__symbol] = new Share('test');

      expect(isShareRef(ref)).toBe(true);
    });
    it('returns `false` for `null` value', () => {
      expect(isShareRef(null)).toBe(false);
    });
    it('returns `false` for string', () => {
      expect(isShareRef('some')).toBe(false);
    });
  });
});
