import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { afterEventFrom, EventEmitter, onDomEventBy, onEventFrom, trackValue, ValueTracker } from 'fun-events';
import { EnterPageEvent, LeavePageEvent, Navigation, NavigationEventType, Page, StayOnPageEvent } from '../navigation';
import { Route } from './route';
import { Router } from './router';
import { RoutingStage, RoutingStart, RoutingStop } from './routing-stage';
import { RoutingSupport } from './routing-support.feature';

describe('Router', () => {

  let navigation: Navigation;
  let onLeave: EventEmitter<[LeavePageEvent]>;
  let onEnter: EventEmitter<[EnterPageEvent]>;
  let onStay: EventEmitter<[StayOnPageEvent]>;
  let location: ValueTracker<Page>;

  beforeEach(() => {
    onLeave = new EventEmitter();
    onEnter = new EventEmitter();
    onStay = new EventEmitter();
    location = trackValue({ url: new URL('http://localhost/index'), data: 'test' });
    navigation = {
      read: location.read,
      onLeave: onDomEventBy(onLeave.on),
      onEnter: onDomEventBy(onEnter.on),
      onStay: onDomEventBy(onStay.on),
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

    const event = new LeavePageEvent(
        NavigationEventType.LeavePage,
        {
          when: 'pre-open',
          from: { url: route.url, data: route.data, },
          to: { url: new URL('/other', route.url), data: 'new', },
        },
    );

    onLeave.send(event);

    const start = stage as RoutingStart;

    expect(start.action).toBe('pre-open');
    expect(start.from).toBe(route);
    expect(start.to.url.href).toBe(event.to.url.href);
    expect(start.to.data).toEqual(event.to.data);
  });
  it('notifies when route reached', () => {

    const event = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'open',
          to: { url: new URL('/other', route.url), data: 'new', },
        },
    );

    onEnter.send(event);

    const stop = stage as RoutingStop;

    expect(stop.action).toBe('open');
    expect(stop.to.url.href).toBe(event.to.url.href);
    expect(stop.to.data).toEqual(event.to.data);
  });
  it('notifies when route aborted', () => {

    const event = new StayOnPageEvent(
        NavigationEventType.StayOnPage,
        {
          from: { url: route.url, data: route.data, },
          to: { url: new URL('/other', route.url), data: 'new' },
        },
    );

    onStay.send(event);

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

        const event = new LeavePageEvent(
            NavigationEventType.LeavePage,
            {
              when: 'pre-open',
              from: { url: route.url, data: route.data, },
              to: { url: new URL('/other', route.url), data: 'new', },
            },
        );

        router.on(a => {
          if (a.action === 'pre-open') {
            a.abort();
          }
        });
        onLeave.send(event);
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });
});
