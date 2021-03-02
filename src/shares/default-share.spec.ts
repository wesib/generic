import { DefaultShare } from './default-share';
import { Share__symbol } from './share-ref';

describe('shares', () => {
  describe('DefaultShare', () => {
    it('builds new instance for each implementation', () => {

      class TestShare extends DefaultShare<any> {
      }

      class TestShare2 extends DefaultShare<any> {
      }

      expect(TestShare[Share__symbol]).not.toBe(DefaultShare[Share__symbol]);
      expect(TestShare2[Share__symbol]).not.toBe(TestShare[Share__symbol]);
      expect(DefaultShare[Share__symbol]).toBe(DefaultShare[Share__symbol]);
      expect(TestShare[Share__symbol]).toBe(TestShare[Share__symbol]);
      expect(TestShare2[Share__symbol]).toBe(TestShare2[Share__symbol]);
    });
    it('has default share name equal to class name', () => {
      class TestShare extends DefaultShare<any> {
      }

      expect(TestShare[Share__symbol].name).toBe(TestShare.name);
    });
    it('allows to override default share name', () => {

      class TestShare extends DefaultShare<any> {

        static get defaultShareName(): string {
          return 'test';
        }

      }

      expect(TestShare[Share__symbol].name).toBe('test');
    });
  });
});
