import Mock = jest.Mock;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { asis, noop } from 'call-thru';
import { afterEventFrom } from 'fun-events';
import { LocationMock } from '../spec/location-mock';
import { NavigateEvent, PreNavigateEvent } from './navigate.event';
import { Navigation } from './navigation';
import { NavigationAgent } from './navigation-agent';
import { NavigationSupport } from './navigation-support.feature';

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

    describe('navigate', () => {
      it('navigates to the target', async () => {
        await navigation.navigate({ url: new URL('http://localhost/other'), data: 'updated', title: 'new title' });
        expect(locationMock.history.pushState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other', data: 'updated' });
      });
      it('navigates to the target URL', async () => {
        await navigation.navigate('/other');
        expect(locationMock.history.pushState).toHaveBeenCalledWith(undefined, '', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other' });
      });
      it('navigates to the same URL', async () => {
        await navigation.navigate({ data: 'updated', title: 'new title' });
        expect(locationMock.history.pushState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/index');
        expect(location).toEqual({ url: 'http://localhost/index', data: 'updated' });
      });
      it('sends navigation events', async () => {

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        await navigation.navigate({ url: '/other', data: 'updated' });

        expect(onPreNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const preNavigate = onPreNavigate.mock.calls[0][0] as PreNavigateEvent;
        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(preNavigate.from.url.href).toBe('http://localhost/index');
        expect(preNavigate.to.url.href).toBe('http://localhost/other');
        expect(preNavigate.type).toBe('wesib:preNavigate');
        expect(preNavigate.action).toBe('pre-navigate');
        expect(preNavigate.from.data).toBe('initial');
        expect(preNavigate.to.data).toBe('updated');

        expect(navigate.from.url.href).toBe('http://localhost/index');
        expect(navigate.to.url.href).toBe('http://localhost/other');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('navigate');
        expect(navigate.from.data).toBe('initial');
        expect(navigate.to.data).toBe('updated');
      });
      it('does not navigate if pre-navigate event is cancelled', async () => {
        navigation.preNavigate.once(event => event.preventDefault());
        expect(await navigation.navigate('/other')).toBe(false);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(locationMock.history.pushState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: 'wesib:dontNavigate' }));
      });
      it('informs on navigation cancellation', async () => {

        let dontNavigate!: PreNavigateEvent;

        navigation.preNavigate.once(event => event.preventDefault());
        navigation.dontNavigate(event => dontNavigate = event);
        await navigation.navigate('/other');
        expect(dontNavigate.to.url.href).toBe('http://localhost/other');
      });
      it('calls agent', async () => {
        expect(await navigation.navigate({ url: '/other', title: 'new title', data: 'new data' })).toBe(true);
        expect(agent).toHaveBeenCalledWith(
            expect.any(Function),
            'pre-navigate',
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
        expect(await navigation.navigate({ url: '/other', title: 'new title', data: 'new data' })).toBe(false);
        expect(agent).toHaveBeenCalled();
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(locationMock.history.pushState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: 'wesib:dontNavigate' }));
      });
      it('cancels the failed navigation', async () => {

        const error = new Error('failed');

        locationMock.history.pushState.mockImplementation(() => { throw error; });

        let dontNavigate!: PreNavigateEvent;

        navigation.dontNavigate(event => dontNavigate = event);
        expect(await navigation.navigate('/other').catch(asis)).toBe(error);
        expect(dontNavigate.to.url.href).toBe('http://localhost/other');
      });
      it('cancels previous navigation when the new one initiated', async () => {
        navigation.preNavigate.once(() => navigation.navigate({ url: '/second', data: 3 }));
        expect(await navigation.navigate('/other')).toBe(false);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(4);
        expect(locationMock.history.pushState).toHaveBeenCalledWith(3, '', 'http://localhost/second');
        expect(locationMock.history.pushState).toHaveBeenCalledTimes(1);
        expect(location).toEqual({ url: 'http://localhost/second', data: 3 });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenLastCalledWith(expect.objectContaining({ type: 'wesib:navigate' }));
      });
      it('cancels previous navigation when the third one initiated', async () => {

        const other = navigation.navigate('/other');
        const second = navigation.navigate('/second');
        const third = navigation.navigate('/third');

        expect(await other).toBe(false);
        expect(await second).toBe(false);
        expect(await third).toBe(true);
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(4);
        expect(locationMock.history.pushState).toHaveBeenCalledWith(undefined, '', 'http://localhost/third');
        expect(locationMock.history.pushState).toHaveBeenCalledTimes(1);
        expect(location).toEqual({ url: 'http://localhost/third' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenLastCalledWith(expect.objectContaining({ type: 'wesib:navigate' }));
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

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        await navigation.replace({ url: '/other', data: 'updated' });
        expect(onPreNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const preNavigate = onPreNavigate.mock.calls[0][0] as PreNavigateEvent;
        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(preNavigate.from.url.href).toBe('http://localhost/index');
        expect(preNavigate.to.url.href).toBe('http://localhost/other');
        expect(preNavigate.type).toBe('wesib:preNavigate');
        expect(preNavigate.action).toBe('pre-replace');
        expect(preNavigate.from.data).toBe('initial');
        expect(preNavigate.to.data).toBe('updated');

        expect(navigate.from.url.href).toBe('http://localhost/index');
        expect(navigate.to.url.href).toBe('http://localhost/other');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('replace');
        expect(navigate.from.data).toBe('initial');
        expect(navigate.to.data).toBe('updated');
      });
      it('does not replace the location if pre-navigate event is cancelled', async () => {
        navigation.preNavigate.once(event => event.preventDefault());
        await navigation.replace('/other');
        expect(locationMock.window.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(locationMock.history.replaceState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(locationMock.window.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: 'wesib:dontNavigate' }));
      });
      it('informs on navigation cancellation', async () => {

        let dontNavigate!: PreNavigateEvent;

        navigation.preNavigate.once(event => event.preventDefault());
        navigation.dontNavigate(event => dontNavigate = event);
        await navigation.replace('/other');
        expect(dontNavigate.to.url.href).toBe('http://localhost/other');
      });
      it('cancels the failed location replacement', async () => {

        const error = new Error('failed');

        locationMock.history.replaceState.mockImplementation(() => { throw error; });

        let dontNavigate!: PreNavigateEvent;

        navigation.dontNavigate(event => dontNavigate = event);
        expect(await navigation.replace('/other').catch(asis)).toBe(error);
        expect(dontNavigate.to.url.href).toBe('http://localhost/other');
      });
    });

    describe('on pop state', () => {
      it('sends navigation event', () => {

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        locationMock.href.mockImplementation(() => 'http://localhost/revisited');
        locationMock.window.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(onPreNavigate).not.toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(navigate.from.url.href).toBe('http://localhost/index');
        expect(navigate.to.url.href).toBe('http://localhost/revisited');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('return');
        expect(navigate.from.data).toBe('initial');
        expect(navigate.to.data).toBe('popped');
      });
      it('updates location', () => {
        locationMock.href.mockImplementation(() => 'http://localhost/revisited');
        locationMock.window.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(location).toEqual({ url: 'http://localhost/revisited', data: 'popped' });
      });
    });
  });
});
