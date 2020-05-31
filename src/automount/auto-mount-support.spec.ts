import { Class, noop } from '@proc7ts/primitives';
import { bootstrapComponents, BootstrapRoot, ElementAdapter, Feature, FeatureDef__symbol } from '@wesib/wesib';
import { autoMountSupport, AutoMountSupport } from './auto-mount-support.feature';
import SpyInstance = jest.SpyInstance;

describe('automount', () => {

  let root: Element;

  beforeEach(() => {
    root = document.createElement('test-root');
    document.body.appendChild(root);
  });
  afterEach(() => {
    root.remove();
  });

  let domContentLoaded: () => void;
  let mockAdapter: ElementAdapter;

  let readyStateSpy: SpyInstance;
  let addEventListenerSpy: SpyInstance;
  let removeEventListenerSpy: SpyInstance;
  let mockReadyState: DocumentReadyState;

  beforeEach(() => {
    domContentLoaded = noop;
    mockAdapter = jest.fn();
    mockReadyState = 'interactive';
    readyStateSpy = jest.spyOn(document, 'readyState', 'get');
    readyStateSpy.mockImplementation(() => mockReadyState);

    const addEventListener = document.addEventListener;

    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    addEventListenerSpy.mockImplementation((event, listener) => {
      if (event === 'DOMContentLoaded') {
        domContentLoaded = () => listener(new Event('DOMContentLoaded'));
      } else {
        addEventListener(event, listener);
      }
    });
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });
  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    readyStateSpy.mockRestore();
  });

  describe('AutoMountSupport', () => {
    it('caches feature definition', () => {
      expect(AutoMountSupport[FeatureDef__symbol]).toBe(AutoMountSupport[FeatureDef__symbol]);
    });
    it('adapts all elements', async () => {

      const qsaSpy = jest.spyOn(root, 'querySelectorAll');

      await bootstrap(AutoMountSupport);

      expect(qsaSpy).toHaveBeenCalledWith('*');
    });
  });
  describe('autoMountSupport', () => {
    it('does not adapt elements when disabled', async () => {

      const qsaSpy = jest.spyOn(root, 'querySelectorAll');

      await bootstrap(autoMountSupport({ select: false }));

      expect(qsaSpy).not.toHaveBeenCalled();
    });
    it('adapts all elements when `select` set to `true`', async () => {

      const qsaSpy = jest.spyOn(root, 'querySelectorAll');

      await bootstrap(autoMountSupport({ select: true }));

      expect(qsaSpy).toHaveBeenCalledWith('*');
    });
    it('selects elements to adapt', async () => {

      const selector = 'some';
      const qsaSpy = jest.spyOn(root, 'querySelectorAll');

      await bootstrap(autoMountSupport({ select: selector }));

      expect(qsaSpy).toHaveBeenCalledWith(selector);
    });
    it('adapts selected elements', async () => {

      const element1 = document.createElement('element-1');
      const element2 = document.createElement('element-2');

      element1.appendChild(element2);
      root.appendChild(element1);
      await Promise.resolve();

      await bootstrap(autoMountSupport());

      expect(mockAdapter).toHaveBeenCalledWith(element1);
      expect(mockAdapter).toHaveBeenCalledWith(element2);
    });
    it('does not register DOMContentLoaded listener if document is loaded', async () => {
      await bootstrap(autoMountSupport());

      expect(addEventListenerSpy).not.toHaveBeenLastCalledWith('DOMContentLoaded', expect.any(Function));
    });
    it('registers DOMContentLoaded listener if document is not loaded', async () => {
      mockReadyState = 'loading';

      const qsaSpy = jest.spyOn(root, 'querySelectorAll');

      await bootstrap(autoMountSupport());
      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function), undefined);
      expect(qsaSpy).not.toHaveBeenCalled();

      domContentLoaded();
      expect(root.querySelectorAll).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });
  });

  async function bootstrap(...features: Class[]): Promise<void> {

    @Feature({
      setup(setup) {
        setup.provide({ a: BootstrapRoot, is: root });
        setup.provide({ a: ElementAdapter, is: mockAdapter });
      },
    })
    class TestFeature {
    }

    await bootstrapComponents(TestFeature, ...features).whenReady();
  }
});
