import {
  ArraySet,
  AutoConnectSupport,
  bootstrapComponents,
  BootstrapRoot,
  BootstrapWindow,
  Class,
  ElementAdapter,
  Feature,
  FeatureDef,
  FeatureDef__symbol,
} from '@wesib/wesib';
import { noop } from 'call-thru';
import { ObjectMock } from '../spec/mocks';
import { autoMountSupport, AutoMountSupport } from './auto-mount-support.feature';
import Mock = jest.Mock;

describe('automount', () => {

  let mockWindow: ObjectMock<Window>;
  let mockDocument: ObjectMock<Document>;
  let domContentLoaded: () => void;
  let mockObserver: ObjectMock<MutationObserver>;
  let mockRoot: {
    querySelectorAll: Mock<any[], [string]>;
    addEventListener: Mock;
  };
  let mockAdapter: ElementAdapter;

  beforeEach(() => {
    domContentLoaded = noop;
    mockObserver = {
      observe: jest.fn(),
    } as any;
    mockDocument = {
      readyState: 'interactive',
      addEventListener: jest.fn((event, listener) => {
        if (event === 'DOMContentLoaded') {
          domContentLoaded = listener;
        }
      }),
      removeEventListener: jest.fn(),
    } as any;
    mockWindow = {
      MutationObserver: jest.fn(() => mockObserver),
      document: mockDocument,
    } as any;
    mockRoot = {
      querySelectorAll: jest.fn(_selector => []),
      addEventListener: jest.fn(),
    };
    mockAdapter = jest.fn();
  });

  describe('AutoMountSupport', () => {
    it('caches feature definition', () => {
      expect(AutoMountSupport[FeatureDef__symbol]).toBe(AutoMountSupport[FeatureDef__symbol]);
    });
    it('enables `AutoConnectSupport`', () => {
      expect([...new ArraySet(FeatureDef.of(AutoMountSupport).needs)]).toContain(AutoConnectSupport);
    });
    it('adapts all elements', async () => {
      await bootstrap(AutoMountSupport);

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith('*');
    });
  });
  describe('autoMountSupport', () => {
    it('does not adapt elements when disabled', async () => {
      await bootstrap(autoMountSupport({ select: false }));

      expect(mockRoot.querySelectorAll).not.toHaveBeenCalled();
    });
    it('adapts all elements when `select` set to `true`', async () => {
      await bootstrap(autoMountSupport({ select: true }));

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith('*');
    });
    it('selects elements to adapt', async () => {

      const selector = 'some';

      await bootstrap(autoMountSupport({ select: selector }));

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith(selector);
    });
    it('adapts selected elements', async () => {

      const element1 = { name: 'element1' };
      const element2 = { name: 'element2' };

      mockRoot.querySelectorAll.mockImplementation(() => [element1, element2]);

      await bootstrap(autoMountSupport());

      expect(mockAdapter).toHaveBeenCalledWith(element1);
      expect(mockAdapter).toHaveBeenCalledWith(element2);
    });
    it('does not register DOMContentLoaded listener if document is loaded', async () => {
      await bootstrap(autoMountSupport());

      expect(mockDocument.addEventListener).not.toHaveBeenLastCalledWith('DOMContentLoaded', expect.any(Function));
    });
    it('registers DOMContentLoaded listener if document is not loaded', async () => {
      (mockDocument as any).readyState = 'loading';

      await bootstrap(autoMountSupport());
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', domContentLoaded, undefined);
      expect(mockRoot.querySelectorAll).not.toHaveBeenCalled();

      domContentLoaded();
      expect(mockRoot.querySelectorAll).toHaveBeenCalled();
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('DOMContentLoaded', domContentLoaded);
    });
  });

  async function bootstrap(...features: Class[]): Promise<void> {

    @Feature({
      set: [
        { a: BootstrapWindow, is: mockWindow },
        { a: BootstrapRoot, is: mockRoot },
        { a: ElementAdapter, is: mockAdapter }
      ],
    })
    class TestFeature {
    }

    await new Promise(resolve => bootstrapComponents(TestFeature, ...features).whenReady(resolve));
  }
});
