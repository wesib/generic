import { noop, valueProvider } from '@proc7ts/primitives';
import { SharedByComponent, SharedByComponent__symbol } from './shared-by-component';

describe('share', () => {
  describe('SharedByComponent', () => {
    describe('hasDetails', () => {
      it('returns `false` for `null` value', () => {
        expect(SharedByComponent.hasDetails(null)).toBe(false);
      });
      it('returns `false` for numeric value', () => {
        expect(SharedByComponent.hasDetails(123)).toBe(false);
      });
      it('returns `false` for string value', () => {
        expect(SharedByComponent.hasDetails('123')).toBe(false);
      });
      it('returns `false` for function', () => {
        expect(SharedByComponent.hasDetails(noop)).toBe(false);
      });
      it('returns `false` for object', () => {
        expect(SharedByComponent.hasDetails({})).toBe(false);
      });
      it('returns `false` for object with non-object [SharedByComponent__symbol] property', () => {
        expect(SharedByComponent.hasDetails({ [SharedByComponent__symbol]: 1 })).toBe(false);
      });
      it('returns `true` for detailed shared value', () => {

        const value: SharedByComponent.Detailed<string> = {
          [SharedByComponent__symbol]: {
            order: 1,
            get: valueProvider('test'),
          },
        };

        expect(SharedByComponent.hasDetails(value)).toBe(true);
      });
    });
  });
});
