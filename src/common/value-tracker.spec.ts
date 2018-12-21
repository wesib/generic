import { trackValue, ValueTracker } from './value-tracker';
import Mock = jest.Mock;

describe('common/value-tracker', () => {
  describe('ValueTracker', () => {

    let v1: ValueTracker<string>;
    let v2: ValueTracker<string | undefined>;

    beforeEach(() => {
      v1 = trackValue('old');
      v2 = trackValue();
    });

    it('is initialized', () => {
      expect(v2.it).toBeUndefined();
      expect(v1.it).toBe('old');
    });
    it('does not report unchanged value', () => {

      const listener = jest.fn();

      v1.on(listener);
      v1.it = v1.it;

      expect(listener).not.toHaveBeenCalled();
    });
    describe('by', () => {

      let listener: Mock;

      beforeEach(() => {
        listener = jest.fn();
        v2.on(listener);
        v2.by(v1);
      });

      it('mirrors another value', () => {
        expect(v2.it).toBe('old');
        expect(listener).toHaveBeenCalledWith('old', undefined);
      });
      it('reflects changes of another value', () => {
        v1.it = 'new';
        expect(v2.it).toBe('new');
        expect(listener).toHaveBeenCalledWith('new', 'old');
      });
      it('rebinds to another source', () => {

        const v3 = trackValue('another');

        v2.by(v3);
        expect(v2.it).toBe(v3.it);
        expect(listener).toHaveBeenCalledWith(v3.it, 'old');
      });
      it('ignores changes in previous source', () => {

        const v3 = trackValue('another');

        v2.by(v3);
        v1.it = 'value';
        expect(v2.it).toBe(v3.it);
      });
    });
    describe('off', () => {
      beforeEach(() => {

        v2.by(v1);
      });

      it('unbinds from the source', () => {
        v2.off();

        const listener = jest.fn();

        v2.on(listener);
        v1.it = 'new';
        expect(v2.it).toBe('old');
        expect(listener).not.toBeUndefined();
      });
    });
  });
});
