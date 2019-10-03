import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { afterEventFrom, EventEmitter, onDomEventBy, onEventFrom, trackValue, ValueTracker } from 'fun-events';
import { NavigateEvent, Navigation, PreNavigateEvent } from '../navigation';
import { Route } from './route';
import { RouteAction, RouteRequest, RouteUpdate } from './route-action';
import { Router } from './router';
import { RoutingSupport } from './routing-support.feature';

describe('Router', () => {

  let navigation: Navigation;
  let preNavigate: EventEmitter<[PreNavigateEvent]>;
  let onNavigate: EventEmitter<[NavigateEvent]>;
  let dontNavigate: EventEmitter<[PreNavigateEvent]>;
  let location: ValueTracker<Navigation.Location>;

  beforeEach(() => {
    preNavigate = new EventEmitter();
    onNavigate = new EventEmitter();
    dontNavigate = new EventEmitter();
    location = trackValue({ url: new URL('http://localhost/index'), data: 'test' });
    navigation = {
      read: location.read,
      preNavigate: onDomEventBy(preNavigate.on),
      onNavigate: onDomEventBy(onNavigate.on),
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
  let action: RouteAction | undefined;

  beforeEach(() => {
    router = bsContext.get(Router);
    router.read(r => route = r);
    action = undefined;
    router.on(a => action = a);
  });

  it('is initialized to current route', () => {
    expect(route.url.href).toBe('http://localhost/index');
    expect(route.data).toBe('test');
    expect(action).toBeUndefined();
  });
  it('updates the route after navigation', () => {
    location.it = { url: new URL('/other', route.url), data: 'new' };
    expect(route.url.href).toBe(location.it.url.href);
    expect(route.data).toBe(location.it.data);
  });
  it('notifies on navigation request', () => {

    const event = new NavigateEvent(
        'wesib:preNavigate',
        {
          action: 'pre-navigate',
          from: route.url,
          oldData: route.data,
          to: new URL('/other', route.url),
          newData: 'new',
        },
    );

    preNavigate.send(event);

    const request = action as RouteRequest;

    expect(request.type).toBe('pre-navigate');
    expect(request.from).toBe(route);
    expect(request.to.url.href).toBe(event.to.href);
    expect(request.to.data).toEqual(event.newData);
  });
  it('notifies on navigation success', () => {

    const event = new NavigateEvent(
        'wesib:navigate',
        {
          action: 'navigate',
          from: route.url,
          oldData: route.data,
          to: new URL('/other', route.url),
          newData: 'new',
        },
    );

    onNavigate.send(event);

    const update = action as RouteUpdate;

    expect(update.type).toBe('navigate');
    expect(update.to.url.href).toBe(event.to.href);
    expect(update.to.data).toEqual(event.newData);
  });
  it('notifies on navigation cancellation', () => {

    const event = new NavigateEvent(
        'wesib:dontNavigate',
        {
          action: 'pre-navigate',
          from: route.url,
          oldData: route.data,
          to: new URL('/other', route.url),
          newData: 'new',
        },
    );

    dontNavigate.send(event);

    const update = action as RouteUpdate;

    expect(update.type).toBe('cancel');
    expect(update.to).toBe(route);
  });

  describe('[AfterEvent__symbol]', () => {
    it('is an alias of `read`', () => {
      expect(afterEventFrom(router)).toBe(router.read);
    });
  });

  describe('[OnEvent__symbol]', () => {
    it('is an alias of `on`', () => {
      expect(onEventFrom(router)).toBe(router.on);
    });
  });

  describe('Route', () => {
    describe('cancel', () => {
      it('cancels navigation', () => {

        const event = new NavigateEvent(
            'wesib:preNavigate',
            {
              action: 'pre-navigate',
              from: route.url,
              oldData: route.data,
              to: new URL('/other', route.url),
              newData: 'new',
            },
        );

        router.on(a => {
          if (a.type === 'pre-navigate') {
            a.cancel();
          }
        });
        preNavigate.send(event);
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });
});
