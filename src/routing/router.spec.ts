import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { afterEventFrom, EventEmitter, onDomEventBy, trackValue, ValueTracker } from 'fun-events';
import { NavigateEvent, Navigation, PreNavigateEvent } from '../navigation';
import { Route } from './route';
import { Router } from './router';
import { RoutingSupport } from './routing-support.feature';

describe('Router', () => {

  let navigation: Navigation;
  let preNavigate: EventEmitter<[PreNavigateEvent]>;
  let dontNavigate: EventEmitter<[PreNavigateEvent]>;
  let location: ValueTracker<Navigation.Location>;

  beforeEach(() => {
    preNavigate = new EventEmitter();
    dontNavigate = new EventEmitter();
    location = trackValue({ url: new URL('http://localhost/index') });
    navigation = {
      read: location.read,
      preNavigate: onDomEventBy(preNavigate.on),
      dontNavigate: onDomEventBy(dontNavigate.on),
    } as Navigation;
  });

  let bsContext: BootstrapContext;

  beforeEach(async () => {

    @Feature({
      needs: RoutingSupport,
      set: [
        { a: Navigation, is: navigation },
      ],
    })
    class TestFeature {}

    bsContext = await new Promise<BootstrapContext>(resolve => {

      const ctx = bootstrapComponents(TestFeature);

      ctx.whenReady(() => resolve(ctx));
    });
  });

  let router: Router;
  let route: Route;
  let activeRoute: Route.Active;

  beforeEach(() => {
    router = bsContext.get(Router);
    router.read(r => route = r);
    router.readActive(r => activeRoute = r);
  });

  it('is initialized to current route', () => {
    expect(route.type).toBe('active');
    expect(route.url.href).toBe('http://localhost/index');
    expect(activeRoute).toBe(route);
  });
  it('updates route before navigating', () => {

    const event = new NavigateEvent(
        'wesib:preNavigate',
        { action: 'pre-navigate', from: activeRoute.url, to: new URL('/other', activeRoute.url) },
    );

    preNavigate.send(event);
    expect(route.type).toBe('pre-navigate');
    expect(route.url.href).toBe(event.to.href);
    expect(activeRoute.url.href).toEqual('http://localhost/index');
  });
  it('updates active route after navigation', () => {
    location.it = { url: new URL('/other', activeRoute.url) };
    expect(route.type).toBe('active');
    expect(route.url.href).toBe(location.it.url.href);
    expect(activeRoute).toBe(route);
  });
  it('updates route when navigation cancelled', () => {

    const event = new NavigateEvent(
        'wesib:dontNavigate',
        { action: 'pre-navigate', from: activeRoute.url, to: new URL('/other', activeRoute.url) },
    );

    dontNavigate.send(event);
    expect(route.type).toBe('active');
    expect(route.url.href).toBe(event.from.href);
    expect(activeRoute.url.href).toBe(route.url.href);
  });

  describe('[AfterEvent__symbol]', () => {
    it('is an alias of `read`', () => {
      expect(afterEventFrom(router)).toBe(router.read);
    });
  });

  describe('Route', () => {
    describe('cancel', () => {
      it('cancels navigation', () => {

        const event = new NavigateEvent(
            'wesib:preNavigate',
            { action: 'pre-navigate', from: activeRoute.url, to: new URL('/other', activeRoute.url) },
        );

        router.read(r => {
          if (r.type === 'pre-navigate') {
            r.cancel();
          }
        });
        preNavigate.send(event);
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });
});
