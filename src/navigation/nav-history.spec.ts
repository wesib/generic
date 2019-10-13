import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { LocationMock } from '../spec/location-mock';
import { Navigation } from './navigation';
import { NavigationSupport } from './navigation-support.feature';
import { Page } from './page';
import { PageParam } from './page-param';
import Mocked = jest.Mocked;

describe('navigation', () => {
  describe('NavHistory', () => {

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock();
    });
    afterEach(() => {
      locationMock.down();
    });

    let navigation: Navigation;

    beforeEach(async () => {

      @Feature({
        needs: NavigationSupport,
        set: { a: BootstrapWindow, is: locationMock.window },
      })
      class TestFeature {}

      const bsContext = await new Promise<BootstrapContext>(resolve => {

        const ctx = bootstrapComponents(TestFeature);

        ctx.whenReady(() => resolve(ctx));
      });

      navigation = bsContext.get(Navigation);
    });

    let page: Page;

    beforeEach(() => {
      navigation.read(p => page = p);
    });

    let handle: Mocked<PageParam.Handle<string, string>>;
    let param: PageParam<string, string>;

    beforeEach(() => {
      [param, handle] = testPageParam();
    });

    describe('Page', () => {
      describe('get', () => {
        it('is undefined by default', () => {
          expect(page.get(param)).toBeUndefined();
        });
        it('is undefined when not provided', async () => {
          await navigation.open('/other');
          expect(page.get(param)).toBeUndefined();
        });
      });
      describe('set', () => {
        it('assigns parameter value', () => {
          page.set(param, 'test');
          expect(page.get(param)).toBe('test');
          expect(handle.enter).toHaveBeenCalledWith(page, 'init');
        });
      });
    });

    describe('LeavePageEvent', () => {
      describe('to.set', () => {
        it('makes parameter available in future route', async () => {

          const promise = new Promise<string | undefined>(resolve => navigation.on.once(event => {
            if (event.when === 'pre-open') {
              event.to.set(param, 'init');
              resolve(event.to.get(param));
            }
          }));

          await navigation.open('/other');

          expect(await promise).toBe('init');
        });
        it('makes parameter available in navigated route', async () => {

          const promise = new Promise<string | undefined>(resolve => navigation.on(event => {
            if (event.when === 'pre-open') {
              event.to.set(param, 'init');
            } else if (event.when === 'open') {
              resolve(event.to.get(param));
            }
          }));

          await navigation.open('/other');

          expect(await promise).toBe('init');
          expect(page.get(param)).toBe('init');
        });
        it('refines existing parameter', async () => {
          await navigation.with(param, 'init').with(param, 'new').open('/other');

          expect(page.get(param)).toBe('new');
          expect(handle.refine).toHaveBeenCalledWith(expect.anything(), 'new');
          expect(handle.refine).toHaveBeenCalledTimes(1);
        });
        it('updates history data', async () => {

          const data = { some: 'test' };

          await navigation.with(param, 'init').with(param, 'new').open({ url: '/other', data });

          expect(page.get(param)).toBe('new');
          expect(page.data).toMatchObject(data);
        });
      });

      describe('preventDefault', () => {
        it('aborts parameter assignment', async () => {
          navigation.on.once(event => {
            if (event.when === 'pre-open') {
              event.to.set(param, 'init');
              event.preventDefault();
            }
          });

          await navigation.open('/other');

          expect(page.url.href).toBe('http://localhost/index');
          expect(page.get(param)).toBeUndefined();
          expect(handle.stay).toHaveBeenCalledTimes(1);
          expect(handle.stay).toHaveBeenCalledWith(page);
          expect(handle.enter).not.toHaveBeenCalled();
          expect(handle.leave).not.toHaveBeenCalled();
          expect(handle.forget).not.toHaveBeenCalled();
        });
      });
    });

    describe('open', () => {
      it('forgets unavailable entries', async () => {
        await navigation.open('/other');
        await navigation.with(param, '1').open('/second');
        expect(handle.enter).toHaveBeenCalledWith(page, 'open');
        navigation.back();
        await navigation.open('/third');

        expect(page.get(param)).toBeUndefined();
        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).toHaveBeenCalledTimes(1);
      });
    });

    describe('replace', () => {
      it('replaces router history entry', async () => {
        await navigation.with(param, 'init').open('/other');

        const [param2, handle2] = testPageParam();

        await navigation.with(param2, 'updated').replace('/second');

        expect(page.get(param)).toBeUndefined();
        expect(page.get(param2)).toBe('updated');

        expect(handle.enter).toHaveBeenCalledTimes(1);
        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).toHaveBeenCalledTimes(1);

        expect(handle2.enter).toHaveBeenCalledWith(page, 'replace');
        expect(handle2.enter).toHaveBeenCalledTimes(1);
        expect(handle2.leave).not.toHaveBeenCalled();
        expect(handle2.forget).not.toHaveBeenCalled();
      });
      it('replaces second router history entry', async () => {
        await navigation.open('/first');
        await navigation.open('/other');
        await navigation.with(param, 'updated').replace('/second');

        expect(page.get(param)).toBe('updated');
        expect(handle.enter).toHaveBeenCalledTimes(1);
      });
      it('replaces non-router history entry', async () => {
        await navigation.with(param, 'init').replace('/other');

        expect(page.get(param)).toBe('init');
        expect(handle.enter).toHaveBeenCalledTimes(1);
        expect(handle.enter).toHaveBeenCalledWith(page, 'replace');
        expect(handle.leave).not.toHaveBeenCalled();
        expect(handle.stay).not.toHaveBeenCalled();
        expect(handle.forget).not.toHaveBeenCalled();
      });
    });

    describe('back', () => {
      it('restores previous entry', async () => {
        await navigation.with(param, 'init').open('/other');

        const [param2, handle2] = testPageParam();

        await navigation.with(param2, 'updated').open('/second');

        expect(page.get(param)).toBeUndefined();
        expect(page.get(param2)).toBe('updated');

        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).not.toHaveBeenCalled();
        expect(handle2.enter).toHaveBeenCalledTimes(1);

        navigation.back();
        expect(page.get(param)).toBe('init');
        expect(page.get(param2)).toBeUndefined();
        expect(handle2.leave).toHaveBeenCalledTimes(1);
        expect(handle2.forget).not.toHaveBeenCalled();
        expect(handle.enter).toHaveBeenCalledTimes(2);
      });
      it('returns to initial history entry', () => {
        locationMock.history.pushState('new', '', '/some');
        navigation.back();
        expect(page.url.href).toBe('http://localhost/index');
        expect(page.data).toBe('initial');
      });
    });
  });
});

export function testPageParam(
    value: string = '',
): [PageParam<string, string>, Mocked<PageParam.Handle<string, string>>] {

  const handle: Mocked<PageParam.Handle<string, string>> = {
    get: jest.fn(() => value),
    refine: jest.fn((_page: Page, newValue: string) => {
      value = newValue;
    }),
    enter: jest.fn(),
    stay: jest.fn(),
    leave: jest.fn(),
    forget: jest.fn(),
  };

  class TestParam extends PageParam<string, string> {
    create(_page: Page, initValue: string): PageParam.Handle<string, string> {
      value = initValue;
      return handle;
    }
  }

  return [new TestParam(), handle];
}
