import { FeatureDef__symbol } from '@wesib/wesib';
import { AbstractFormPreset } from './abstract-form-preset';

describe('forms', () => {
  describe('AbstractFormPreset', () => {

    class TestFormPreset extends AbstractFormPreset {
    }

    describe('feature definition', () => {
      it('is created per preset', () => {
        expect(TestFormPreset[FeatureDef__symbol]).not.toBe(AbstractFormPreset[FeatureDef__symbol]);
      });
    });

    describe('setupField', () => {
      it('does nothing', () => {
        expect(new TestFormPreset().setupField(null!)).toBeUndefined();
      });
    });

    describe('setupForm', () => {
      it('does nothing', () => {
        expect(new TestFormPreset().setupForm(null!)).toBeUndefined();
      });
    });

  });
});
