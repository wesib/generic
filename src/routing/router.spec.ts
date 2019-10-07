import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { afterEventFrom, EventEmitter, onDomEventBy, onEventFrom, trackValue, ValueTracker } from 'fun-events';
import { NavigateEvent, Navigation, PreNavigateEvent } from '../navigation';
import { Route } from './route';
import { Router } from './router';
import { RoutingStage, RoutingStart, RoutingStop } from './routing-stage';
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
  let stage: RoutingStage | undefined;

  beforeEach(() => {
    router = bsContext.get(Router);
    router.read(r => route = r);
    stage = undefined;
    router.on(s => stage = s);
  });

  it('is initialized to current route', () => {
    expect(route.url.href).toBe('http://localhost/index');
    expect(route.data).toBe('test');
    expect(stage).toBeUndefined();
  });
  it('updates the route after navigation', () => {
    location.it = { url: new URL('/other', route.url), data: 'new' };
    expect(route.url.href).toBe(location.it.url.href);
    expect(route.data).toBe(location.it.data);
  });
  it('notifies when route requested', () => {

    const event = new NavigateEvent(
        'wesib:preNavigate',
        {
          action: 'pre-navigate',
          from: { url: route.url, data: route.data, },
          to: { url: new URL('/other', route.url), data: 'new', },
        },
    );

    preNavigate.send(event);

    const start = stage as RoutingStart;

    expect(start.action).toBe('pre-navigate');
    expect(start.from).toBe(route);
    expect(start.to.url.href).toBe(event.to.url.href);
    expect(start.to.data).toEqual(event.to.data);
  });
  it('notifies when route reached', () => {

    const event = new NavigateEvent(
        'wesib:navigate',
        {
          action: 'navigate',
          from: { url: route.url, data: route.data, },
          to: { url: new URL('/other', route.url), data: 'new', },
        },
    );

    onNavigate.send(event);

    const stop = stage as RoutingStop;

    expect(stop.action).toBe('navigate');
    expect(stop.to.url.href).toBe(event.to.url.href);
    expect(stop.to.data).toEqual(event.to.data);
  });
  it('notifies when route aborted', () => {

    const event = new NavigateEvent(
        'wesib:dontNavigate',
        {
          action: 'pre-navigate',
          from: { url: route.url, data: route.data, },
          to: { url: new URL('/other', route.url), data: 'new' },
        },
    );

    dontNavigate.send(event);

    const stop = stage as RoutingStop;

    expect(stop.action).toBe('abort');
    expect(stop.to).toBe(route);
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
    describe('abort', () => {
      it('aborts navigation', () => {

        const event = new NavigateEvent(
            'wesib:preNavigate',
            {
              action: 'pre-navigate',
              from: { url: route.url, data: route.data, },
              to: { url: new URL('/other', route.url), data: 'new', },
            },
        );

        router.on(a => {
          if (a.action === 'pre-navigate') {
            a.abort();
          }
        });
        preNavigate.send(event);
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });
});
