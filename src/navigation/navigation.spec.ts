import Mock = jest.Mock;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { asis, noop } from 'call-thru';
import { afterEventFrom, onEventFrom } from 'fun-events';
import { LocationMock } from '../spec/location-mock';
import { Navigation } from './navigation';
import { NavigationAgent } from './navigation-agent';
import { NavigationSupport } from './navigation-support.feature';
import { EnterPageEvent, LeavePageEvent, NavigationEventType, StayOnPageEvent } from './navigation.event';

describe('navigation', () => {
  describe('Navigation', () => {

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock();
    });
    afterEach(() => {
      locationMock.down();
    });

    let navigation: Navigation;
    let agent: Mock<ReturnType<NavigationAgent>, Parameters<NavigationAgent>>;

    beforeEach(async () => {

      let context: BootstrapContext = null!;

      agent = jest.fn((next, _action, _from, _to) => next());

      @Feature({
        set: [
          { a: BootstrapWindow, is: locationMock.window },
          { a: NavigationAgent, is: agent },
        ],
        needs: NavigationSupport,
        init(ctx) {
          context = ctx;
        },
      })
      class TestFeature {
      }

      await new Promise(resolve => bootstrapComponents(TestFeature).whenReady(resolve));
      navigation = context.get(Navigation);
    });

    let location: { url: string, data: any };

    beforeEach(() => {
      navigation.read(({ url, data }) => location = { url: url.href, data });
    });

    it('reads initial location from `Location` and `History`', () => {
      expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
      expect(locationMock.href).toHaveBeenCalled();
      expect(locationMock.state).toHaveBeenCalled();
    });

    describe('length', () => {
      it('returns history length', () => {
        expect(navigation.length).toBe(1);
        expect(locationMock.historyLength).toHaveBeenCalled();
      });
    });

    describe('go', () => {
      it('calls `History.go(delta)`', () => {
        navigation.go(10);
        expect(locationMock.history.go).toHaveBeenCalledWith(10);
      });
    });

    describe('back', () => {
      it('calls `History.go(-1)`', () => {
        navigation.back();
        expect(locationMock.history.go).toHaveBeenCalledWith(-1);
      });
    });

    describe('forward', () => {
      it('calls `History.go(1)`', () => {
        navigation.forward();
        expect(locationMock.history.go).toHaveBeenCalledWith(1);
      });
    });

    describe('reload', () => {
      it('calls `History.go()`', () => {
        navigation.reload();
        expect(locationMock.history.go).toHaveBeenCalledWith(undefined);
      });
    });

    describe('[AfterEvent__symbol]', () => {
      it('is the same as `read`', () => {
        expect(afterEventFrom(navigation)).toBe(navigation.read);
      });
    });

    describe('[OnEvent__symbol]', () => {
      it('is the same as `on`', () => {
        expect(onEventFrom(navigation)).toBe(navigation.on);
      });
    });

    describe('open', () => {
      it('navigates to target', async () => {
        await navigation.open({ url: new URL('http://localhost/other'), data: 'updated', title: 'new title' });
        expect(locationMock.history.pushState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other', data: 'updated' });
      });
      it('navigates to path', async () => {
        await navigation.open('other');
        expect(locationMock.history.pushState).toHaveBeenCalledWith(undefined, '', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other' });
      });
      it('navigates to the same URL', async () => {
        await navigation.open({ data: 'updated', title: 'new title' });
        expect(locationMock.history.pushState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/index');
        expect(location).toEqual({ url: 'http://localhost/index', data: 'updated' });
      });
      it('sends navigation events', async () => {

        const onLeave = jest.fn();
        const onEnter = jest.fn();
        const onEvent = jest.fn();

        navigation.onLeave(onLeave);
        navigation.onEnter(onEnter);
        navigation.on(onEvent);

        await navigation.open({ url: '/other', data: 'updated' });

        expect(onLeave).toHaveBeenCalledTimes(1);
        expect(onEnter).toHaveBeenCalledTimes(1);

        const leavePage = onLeave.mock.calls[0][0] as LeavePageEvent;
        const enterPage = onEnter.mock.calls[0][0] as EnterPageEvent;

        expect(onEvent).toHaveBeenCalledWith(leavePage);
        expect(onEvent).toHaveBeenLastCalledWith(enterPage);

        expect(leavePage.when).toBe('pre-open');
        expect(leavePage.from.url.href).toBe('http://localhost/index');
        expect(leavePage.to.url.href).toBe('http://localhost/other');
        expect(leavePage.type).toBe(NavigationEventType.LeavePage);
        expect(leavePage.from.data).toBe('initial');
        expect(leavePage.to.data).toBe('updated');

        expect(enterPage.when).toBe('open');
        expect(enterPage.to.url.href).toBe('http://localhost/other');
        expect(enterPage.type).toBe(NavigationEventType.EnterPage);
        expect(enterPage.to.data).toBe('updated');
      });
      it('does not navigate if pre-navigate event is cancelled', async () => {
        navigation.onLeave.once(event => event.preventDefault());
        expect(await navigation.open('/other')).toBe(false);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(locationMock.history.pushState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: NavigationEventType.StayOnPage }));
      });
      it('informs on navigation cancellation', async () => {

        const onEvent = jest.fn();
        let stayOnPage!: StayOnPageEvent;

        navigation.onLeave.once(event => event.preventDefault());
        navigation.onStay(event => stayOnPage = event);
        navigation.on(onEvent);
        await navigation.open('/other');
        expect(stayOnPage.when).toBe('stay');
        expect(stayOnPage.to.url.href).toBe('http://localhost/other');
        expect(stayOnPage.reason).toBeUndefined();
        expect(onEvent).toHaveBeenLastCalledWith(stayOnPage);
      });
      it('calls agent', async () => {
        expect(await navigation.open({ url: '/other', title: 'new title', data: 'new data' })).toBe(true);
        expect(agent).toHaveBeenCalledWith(
            expect.any(Function),
            'pre-open',
            {
              url: new URL('http://localhost/index'),
              data: 'initial',
            },
            {
              url: new URL('http://localhost/other'),
              title: 'new title',
              data: 'new data',
            },
        );
      });
      it('cancels navigation if agent didn\'t call the next one', async () => {
        agent.mockImplementation(noop);
        expect(await navigation.open({ url: '/other', title: 'new title', data: 'new data' })).toBe(false);
        expect(agent).toHaveBeenCalled();
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(locationMock.history.pushState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: NavigationEventType.StayOnPage }));
      });
      it('cancels the failed navigation', async () => {

        const error = new Error('failed');

        locationMock.history.pushState.mockImplementation(() => { throw error; });

        let stayOnPage!: StayOnPageEvent;

        navigation.onStay(event => stayOnPage = event);
        expect(await navigation.open('/other').catch(asis)).toBe(error);
        expect(stayOnPage.when).toBe('stay');
        expect(stayOnPage.to.url.href).toBe('http://localhost/other');
        expect(stayOnPage.reason).toBe(error);
      });
      it('cancels previous navigation when the new one initiated', async () => {
        navigation.onLeave.once(() => navigation.open({ url: '/second', data: 3 }));
        expect(await navigation.open('/other')).toBe(false);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(4);
        expect(locationMock.history.pushState).toHaveBeenCalledWith(3, '', 'http://localhost/second');
        expect(locationMock.history.pushState).toHaveBeenCalledTimes(1);
        expect(location).toEqual({ url: 'http://localhost/second', data: 3 });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenLastCalledWith(expect.objectContaining({ type: NavigationEventType.EnterPage }));
      });
      it('cancels previous navigation when the third one initiated', async () => {

        const other = navigation.open('/other');
        const second = navigation.open('/second');
        const third = navigation.open('/third');

        expect(await other).toBe(false);
        expect(await second).toBe(false);
        expect(await third).toBe(true);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(4);
        expect(locationMock.history.pushState).toHaveBeenCalledWith(undefined, '', 'http://localhost/third');
        expect(locationMock.history.pushState).toHaveBeenCalledTimes(1);
        expect(location).toEqual({ url: 'http://localhost/third' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenLastCalledWith(expect.objectContaining({ type: NavigationEventType.EnterPage }));
      });
    });

    describe('replace', () => {
      it('replaces location with the target', async () => {
        await navigation.replace({ url: new URL('http://localhost/other'), data: 'updated', title: 'new title' });
        expect(locationMock.history.replaceState)
            .toHaveBeenCalledWith('updated', 'new title', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other', data: 'updated' });
      });
      it('replaces location with the target URL', async () => {
        await navigation.replace('/other');
        expect(locationMock.history.replaceState)
            .toHaveBeenCalledWith(undefined, '', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other' });
      });
      it('replaces location with the same URL', async () => {
        await navigation.replace({ data: 'updated', title: 'new title' });
        expect(locationMock.history.replaceState)
            .toHaveBeenCalledWith('updated', 'new title', 'http://localhost/index');
        expect(location).toEqual({ url: 'http://localhost/index', data: 'updated' });
      });
      it('sends navigation events', async () => {

        const onLeave = jest.fn();
        const onEnter = jest.fn();

        navigation.onLeave(onLeave);
        navigation.onEnter(onEnter);

        await navigation.replace({ url: '/other', data: 'updated' });
        expect(onLeave).toHaveBeenCalledTimes(1);
        expect(onEnter).toHaveBeenCalledTimes(1);

        const leavePage = onLeave.mock.calls[0][0] as LeavePageEvent;
        const enterPage = onEnter.mock.calls[0][0] as EnterPageEvent;

        expect(leavePage.when).toBe('pre-replace');
        expect(leavePage.from.url.href).toBe('http://localhost/index');
        expect(leavePage.to.url.href).toBe('http://localhost/other');
        expect(leavePage.type).toBe(NavigationEventType.LeavePage);
        expect(leavePage.from.data).toBe('initial');
        expect(leavePage.to.data).toBe('updated');

        expect(enterPage.when).toBe('replace');
        expect(enterPage.to.url.href).toBe('http://localhost/other');
        expect(enterPage.type).toBe(NavigationEventType.EnterPage);
        expect(enterPage.to.data).toBe('updated');
      });
      it('does not replace the location if pre-navigate event is cancelled', async () => {
        navigation.onLeave.once(event => event.preventDefault());
        await navigation.replace('/other');
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(locationMock.history.replaceState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: NavigationEventType.StayOnPage }));
      });
      it('informs on navigation cancellation', async () => {

        let stayOnPage!: StayOnPageEvent;

        navigation.onLeave.once(event => event.preventDefault());
        navigation.onStay(event => stayOnPage = event);
        await navigation.replace('/other');
        expect(stayOnPage.when).toBe('stay');
        expect(stayOnPage.to.url.href).toBe('http://localhost/other');
        expect(stayOnPage.reason).toBeUndefined();
      });
      it('cancels the failed location replacement', async () => {

        const error = new Error('failed');

        locationMock.history.replaceState.mockImplementation(() => { throw error; });

        let stayOnPage!: StayOnPageEvent;

        navigation.onStay(event => stayOnPage = event);
        expect(await navigation.replace('/other').catch(asis)).toBe(error);
        expect(stayOnPage.when).toBe('stay');
        expect(stayOnPage.to.url.href).toBe('http://localhost/other');
        expect(stayOnPage.reason).toBe(error);
      });
    });

    describe('on pop state', () => {
      it('sends navigation event', () => {

        const onLeave = jest.fn();
        const onEnter = jest.fn();

        navigation.onLeave(onLeave);
        navigation.onEnter(onEnter);

        locationMock.href.mockImplementation(() => 'http://localhost/revisited');
        locationMock.window.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(onLeave).not.toHaveBeenCalled();
        expect(onEnter).toHaveBeenCalledTimes(1);

        const enter = onEnter.mock.calls[0][0] as EnterPageEvent;

        expect(enter.when).toBe('return');
        expect(enter.to.url.href).toBe('http://localhost/revisited');
        expect(enter.type).toBe(NavigationEventType.EnterPage);
        expect(enter.to.data).toBe('popped');
      });
      it('updates location', () => {
        locationMock.href.mockImplementation(() => 'http://localhost/revisited');
        locationMock.window.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(location).toEqual({ url: 'http://localhost/revisited', data: 'popped' });
      });
    });
  });
});
