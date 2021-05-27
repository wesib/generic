import { describe, expect, it } from '@jest/globals';
import { noop, valueProvider } from '@proc7ts/primitives';
import { SharedValue, SharedValue__symbol } from './shared-value';

describe('shares', () => {
  describe('SharedValue', () => {
    describe('hasDetails', () => {
      it('returns `false` for `null` value', () => {
        expect(SharedValue.hasDetails(null)).toBe(false);
      });
      it('returns `false` for numeric value', () => {
        expect(SharedValue.hasDetails(123)).toBe(false);
      });
      it('returns `false` for string value', () => {
        expect(SharedValue.hasDetails('123')).toBe(false);
      });
      it('returns `false` for function', () => {
        expect(SharedValue.hasDetails(noop)).toBe(false);
      });
      it('returns `false` for object', () => {
        expect(SharedValue.hasDetails({})).toBe(false);
      });
      it('returns `false` for object with non-object [SharedValue__symbol] property', () => {
        expect(SharedValue.hasDetails({ [SharedValue__symbol]: 1 })).toBe(false);
      });
      it('returns `true` for detailed shared value', () => {

        const value: SharedValue.Detailed<string> = {
          [SharedValue__symbol]: {
            priority: 1,
            get: valueProvider('test'),
          },
        };

        expect(SharedValue.hasDetails(value)).toBe(true);
      });
    });
  });
});
