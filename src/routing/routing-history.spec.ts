import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { Navigation } from '../navigation';
import { LocationMock } from '../spec/location-mock';
import { Route } from './route';
import { RouteParam } from './route-param';
import { Router } from './router';
import { RoutingStart } from './routing-stage';
import { RoutingSupport } from './routing-support.feature';
import Mocked = jest.Mocked;

describe('routing', () => {
  describe('RoutingHistory', () => {

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock();
    });
    afterEach(() => {
      locationMock.down();
    });

    let navigation: Navigation;
    let router: Router;

    beforeEach(async () => {

      @Feature({
        needs: RoutingSupport,
        set: { a: BootstrapWindow, is: locationMock.window },
      })
      class TestFeature {}

      const bsContext = await new Promise<BootstrapContext>(resolve => {

        const ctx = bootstrapComponents(TestFeature);

        ctx.whenReady(() => resolve(ctx));
      });

      navigation = bsContext.get(Navigation);
      router = bsContext.get(Router);
    });

    let route: Route;

    beforeEach(() => {
      router.read(r => route = r);
    });

    let handle: Mocked<RouteParam.Handle<string, string>>;
    let param: RouteParam<string, string>;

    beforeEach(() => {
      [param, handle] = newParam();
    });

    describe('Route', () => {
      describe('param', () => {
        it('is undefined by default', () => {
          expect(route.param(param)).toBeUndefined();
        });
        it('is undefined when not provided', async () => {
          await navigation.open('/other');
          expect(route.param(param)).toBeUndefined();
        });
      });
    });

    describe('RouteStage', () => {
      describe('param', () => {
        it('makes parameter available in future route', async () => {

          const promise = new Promise<string | undefined>(resolve => router.on.once(stage => {
            if (stage.action === 'pre-open') {
              stage.param(param, 'init');
              resolve(stage.to.param(param));
            }
          }));

          await navigation.open('/other');

          expect(await promise).toBe('init');
        });
        it('makes parameter available in navigated route', async () => {

          const promise = new Promise<string | undefined>(resolve => router.on(stage => {
            if (stage.action === 'pre-open') {
              stage.param(param, 'init');
            } else if (stage.action === 'open') {
              resolve(stage.to.param(param));
            }
          }));

          await navigation.open('/other');

          expect(await promise).toBe('init');
          expect(route.param(param)).toBe('init');
        });
        it('refines existing parameter', async () => {
          router.on.once(stage => {
            if (stage.action === 'pre-open') {
              stage.param(param, 'init');
              stage.param(param, 'new');
            }
          });

          await navigation.open('/other');

          expect(route.param(param)).toBe('new');
          expect(handle.refine).toHaveBeenCalledWith(expect.anything(), 'new');
          expect(handle.refine).toHaveBeenCalledTimes(1);
        });
        it('updates history data', async () => {
          router.on.once(stage => {
            if (stage.action === 'pre-open') {
              stage.param(param, 'init');
              stage.param(param, 'new');
            }
          });

          const data = { some: 'test' };

          await navigation.open({ url: '/other', data });

          expect(route.param(param)).toBe('new');
          expect(route.data).toMatchObject(data);
        });
      });

      describe('abort', () => {
        it('aborts parameter assignment', async () => {
          router.on.once(stage => {
            if (stage.action === 'pre-open') {
              stage.param(param, 'init');
              stage.abort();
            }
          });

          await navigation.open('/other');

          expect(route.url.href).toBe('http://localhost/index');
          expect(route.param(param)).toBeUndefined();
          expect(handle.abort).toHaveBeenCalledTimes(1);
          expect(handle.enter).not.toHaveBeenCalled();
          expect(handle.leave).not.toHaveBeenCalled();
          expect(handle.forget).not.toHaveBeenCalled();
        });
      });
    });

    describe('open', () => {
      it('forgets unavailable entries', async () => {
        await navigation.open('/other');

        router.on.once(stage => {
          if (stage.action === 'pre-open') {
            stage.param(param, '1');
          }
        });

        await navigation.open('/second');
        navigation.back();
        await navigation.open('/third');

        expect(route.param(param)).toBeUndefined();
        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).toHaveBeenCalledTimes(1);
      });
    });

    describe('replace', () => {
      it('replaces router history entry', async () => {
        router.on.once(stage => {
          if (stage.action === 'pre-open') {
            stage.param(param, 'init');
          }
        });

        await navigation.open('/other');

        const [param2, handle2] = newParam();

        router.on.once(stage => {
          if (stage.action === 'pre-replace') {
            stage.param(param2, 'updated');
          }
        });

        await navigation.replace('/second');

        expect(route.param(param)).toBeUndefined();
        expect(route.param(param2)).toBe('updated');

        expect(handle.enter).toHaveBeenCalledTimes(1);
        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).toHaveBeenCalledTimes(1);

        expect(handle2.enter).toHaveBeenCalledTimes(1);
        expect(handle2.leave).not.toHaveBeenCalled();
        expect(handle2.forget).not.toHaveBeenCalled();
      });
      it('replaces second router history entry', async () => {
        await navigation.open('/first');
        await navigation.open('/other');
        router.on.once(stage => {
          if (stage.action === 'pre-replace') {
            stage.param(param, 'updated');
          }
        });

        await navigation.replace('/second');

        expect(route.param(param)).toBe('updated');
        expect(handle.enter).toHaveBeenCalledTimes(1);
      });
      it('replaces non-router history entry', async () => {
        router.on.once(async stage => {
          if (stage.action === 'pre-replace') {
            stage.param(param, 'init');
          }
        });

        await navigation.replace('/other');

        expect(route.param(param)).toBe('init');
        expect(handle.enter).toHaveBeenCalledTimes(1);
        expect(handle.leave).not.toHaveBeenCalled();
        expect(handle.abort).not.toHaveBeenCalled();
        expect(handle.forget).not.toHaveBeenCalled();
      });
    });

    describe('back', () => {
      it('restores previous entry', async () => {
        router.on.once(stage => {
          if (stage.action === 'pre-open') {
            stage.param(param, 'init');
          }
        });

        await navigation.open('/other');

        const [param2, handle2] = newParam();

        router.on.once(stage => {
          if (stage.action === 'pre-open') {
            stage.param(param2, 'updated');
          }
        });

        await navigation.open('/second');

        expect(route.param(param)).toBeUndefined();
        expect(route.param(param2)).toBe('updated');

        expect(handle.leave).toHaveBeenCalledTimes(1);
        expect(handle.forget).not.toHaveBeenCalled();
        expect(handle2.enter).toHaveBeenCalledTimes(1);

        navigation.back();
        expect(route.param(param)).toBe('init');
        expect(route.param(param2)).toBeUndefined();
        expect(handle2.leave).toHaveBeenCalledTimes(1);
        expect(handle2.forget).not.toHaveBeenCalled();
        expect(handle.enter).toHaveBeenCalledTimes(2);
      });
      it('returns to non-router history entry', () => {
        locationMock.history.pushState('new', '', '/some');
        navigation.back();
        expect(route.url.href).toBe('http://localhost/index');
        expect(route.data).toBe('initial');
      });
    });
  });
});

function newParam(value: string = ''): [RouteParam<string, string>, Mocked<RouteParam.Handle<string, string>>] {

  const handle: Mocked<RouteParam.Handle<string, string>> = {
    get: jest.fn(() => value),
    refine: jest.fn((_route: RoutingStart, newValue: string) => {
      value = newValue;
    }),
    enter: jest.fn(),
    abort: jest.fn(),
    leave: jest.fn(),
    forget: jest.fn(),
  };

  class TestParam extends RouteParam<string, string> {
    create(_stage: RoutingStart, initValue: string): RouteParam.Handle<string, string> {
      value = initValue;
      return handle;
    }
  }

  return [new TestParam(), handle];
}
