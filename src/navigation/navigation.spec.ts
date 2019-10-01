import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { afterEventFrom } from 'fun-events';
import { NavigateEvent, PreNavigateEvent } from './navigate.event';
import { Navigation } from './navigation';
import { NavigationSupport } from './navigation-support.feature';

describe('navigation', () => {
  describe('Navigation', () => {

    let mockedWindow: Mocked<Window>;
    let mockedLocation: Mocked<Location>;
    let mockBaseURI: Mock<string, []>;
    let mockHref: Mock<string, []>;
    let mockedHistory: Mocked<History>;
    let mockHistoryLength: Mock<number, []>;
    let mockState: Mock<string, []>;

    beforeEach(() => {
      mockHref = jest.fn(() => 'http://localhost/index');
      mockedLocation = {
        get href() {
          return mockHref();
        }
      } as any;
      mockState = jest.fn(() => 'initial');
      mockHistoryLength = jest.fn(() => 13);
      mockedHistory = {
        get length() {
          return mockHistoryLength();
        },
        get state() {
          return mockState();
        },
        go: jest.fn(),
        pushState: jest.fn(),
        replaceState: jest.fn(),
      } as any;
      mockBaseURI = jest.fn(() => 'http://localhost');
      mockedWindow = {
        location: mockedLocation,
        history: mockedHistory,
        addEventListener: jest.spyOn(window, 'addEventListener'),
        removeEventListener: jest.spyOn(window, 'removeEventListener'),
        dispatchEvent: jest.spyOn(window, 'dispatchEvent'),
        document: {
          get baseURI() {
            return mockBaseURI();
          }
        },
      } as any;
    });
    afterEach(() => {
      mockedWindow.dispatchEvent.mockRestore();
      mockedWindow.addEventListener.mockRestore();
      mockedWindow.removeEventListener.mockRestore();
    });

    let navigation: Navigation;

    beforeEach(async () => {

      let context: BootstrapContext = null!;

      @Feature({
        set: { a: BootstrapWindow, is: mockedWindow },
        needs: NavigationSupport,
        init(ctx) {
          context = ctx;
        }
      })
      class TestFeature {
      }

      await new Promise(resolve => bootstrapComponents(TestFeature).whenReady(resolve));
      navigation = context.get(Navigation);
    });

    let location: { url: string, data: any };

    beforeEach(() => {
      navigation.read(({ url, data }) => location = { url: url.toString(), data });
    });

    it('reads initial location from `Location` and `History`', () => {
      expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
      expect(mockHref).toHaveBeenCalled();
      expect(mockState).toHaveBeenCalled();
    });

    describe('length', () => {
      it('returns history length', () => {
        expect(navigation.length).toBe(13);
        expect(mockHistoryLength).toHaveBeenCalled();
      });
    });

    describe('go', () => {
      it('calls `History.go(delta)`', () => {
        navigation.go(10);
        expect(mockedHistory.go).toHaveBeenCalledWith(10);
      });
    });

    describe('back', () => {
      it('calls `History.go(-1)`', () => {
        navigation.back();
        expect(mockedHistory.go).toHaveBeenCalledWith(-1);
      });
    });

    describe('forward', () => {
      it('calls `History.go(1)`', () => {
        navigation.forward();
        expect(mockedHistory.go).toHaveBeenCalledWith(1);
      });
    });

    describe('reload', () => {
      it('calls `History.go()`', () => {
        navigation.reload();
        expect(mockedHistory.go).toHaveBeenCalledWith(undefined);
      });
    });

    describe('[AfterEvent__symbol]', () => {
      it('is the same as `read`', () => {
        expect(afterEventFrom(navigation)).toBe(navigation.read);
      });
    });

    describe('navigate', () => {
      it('navigates to the target', () => {
        navigation.navigate({ url: new URL('http://localhost/other'), data: 'updated', title: 'new title' });
        expect(mockedHistory.pushState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other', data: 'updated' });
      });
      it('navigates to the target URL', () => {
        navigation.navigate('/other');
        expect(mockedHistory.pushState).toHaveBeenCalledWith(undefined, '', '/other');
        expect(location).toEqual({ url: 'http://localhost/other' });
      });
      it('navigates to the same URL', () => {
        navigation.navigate({ data: 'updated', title: 'new title' });
        expect(mockedHistory.pushState).toHaveBeenCalledWith('updated', 'new title', undefined);
        expect(location).toEqual({ url: 'http://localhost/index', data: 'updated' });
      });
      it('sends navigation events', () => {

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        navigation.navigate({ url: '/other', data: 'updated' });

        expect(onPreNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const preNavigate = onPreNavigate.mock.calls[0][0] as PreNavigateEvent;
        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(preNavigate.from.toString()).toBe('http://localhost/index');
        expect(preNavigate.to.toString()).toBe('http://localhost/other');
        expect(preNavigate.type).toBe('wesib:preNavigate');
        expect(preNavigate.action).toBe('pre-navigate');
        expect(preNavigate.oldData).toBe('initial');
        expect(preNavigate.newData).toBe('updated');

        expect(navigate.from.toString()).toBe('http://localhost/index');
        expect(navigate.to.toString()).toBe('http://localhost/other');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('navigate');
        expect(navigate.oldData).toBe('initial');
        expect(navigate.newData).toBe('updated');
      });
      it('does not navigate if pre-navigate event is cancelled', () => {
        navigation.preNavigate.once(event => event.preventDefault());
        navigation.navigate('/other');
        expect(mockedWindow.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(mockedHistory.pushState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(mockedWindow.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: 'wesib:dontNavigate' }));
      });
      it('informs on navigation cancellation', () => {

        let dontNavigate!: PreNavigateEvent;

        navigation.preNavigate.once(event => event.preventDefault());
        navigation.dontNavigate(event => dontNavigate = event);
        navigation.navigate('/other');
        expect(dontNavigate.to.href).toEqual('http://localhost/other');
      });
      it('cancels the failed navigation', () => {

        const error = new Error('failed');

        mockedHistory.pushState.mockImplementation(() => { throw error; });

        let dontNavigate!: PreNavigateEvent;

        navigation.dontNavigate(event => dontNavigate = event);
        expect(() => navigation.navigate('/other')).toThrow(error);
        expect(dontNavigate.to.href).toEqual('http://localhost/other');
      });
    });

    describe('replace', () => {
      it('replaces location with the target', () => {
        navigation.replace({ url: new URL('http://localhost/other'), data: 'updated', title: 'new title' });
        expect(mockedHistory.replaceState).toHaveBeenCalledWith('updated', 'new title', 'http://localhost/other');
        expect(location).toEqual({ url: 'http://localhost/other', data: 'updated' });
      });
      it('replaces location with the target URL', () => {
        navigation.replace('/other');
        expect(mockedHistory.replaceState).toHaveBeenCalledWith(undefined, '', '/other');
        expect(location).toEqual({ url: 'http://localhost/other' });
      });
      it('replaces location with the same URL', () => {
        navigation.replace({ data: 'updated', title: 'new title' });
        expect(mockedHistory.replaceState).toHaveBeenCalledWith('updated', 'new title', undefined);
        expect(location).toEqual({ url: 'http://localhost/index', data: 'updated' });
      });
      it('sends navigation events', () => {

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        navigation.replace({ url: '/other', data: 'updated' });
        expect(onPreNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const preNavigate = onPreNavigate.mock.calls[0][0] as PreNavigateEvent;
        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(preNavigate.from.toString()).toBe('http://localhost/index');
        expect(preNavigate.to.toString()).toBe('http://localhost/other');
        expect(preNavigate.type).toBe('wesib:preNavigate');
        expect(preNavigate.action).toBe('pre-replace');
        expect(preNavigate.oldData).toBe('initial');
        expect(preNavigate.newData).toBe('updated');

        expect(navigate.from.toString()).toBe('http://localhost/index');
        expect(navigate.to.toString()).toBe('http://localhost/other');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('replace');
        expect(navigate.oldData).toBe('initial');
        expect(navigate.newData).toBe('updated');
      });
      it('does not replace the location if pre-navigate event is cancelled', () => {
        navigation.preNavigate.once(event => event.preventDefault());
        navigation.replace('/other');
        expect(mockedWindow.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(mockedHistory.replaceState).not.toHaveBeenCalled();
        expect(location).toEqual({ url: 'http://localhost/index', data: 'initial' });
        expect(mockedWindow.dispatchEvent)
            .toHaveBeenCalledWith(expect.objectContaining({ type: 'wesib:dontNavigate' }));
      });
      it('informs on navigation cancellation', () => {

        let dontNavigate!: PreNavigateEvent;

        navigation.preNavigate.once(event => event.preventDefault());
        navigation.dontNavigate(event => dontNavigate = event);
        navigation.replace('/other');
        expect(dontNavigate.to.href).toEqual('http://localhost/other');
      });
      it('cancels the failed location replacement', () => {

        const error = new Error('failed');

        mockedHistory.replaceState.mockImplementation(() => { throw error; });

        let dontNavigate!: PreNavigateEvent;

        navigation.dontNavigate(event => dontNavigate = event);
        expect(() => navigation.replace('/other')).toThrow(error);
        expect(dontNavigate.to.href).toEqual('http://localhost/other');
      });
    });

    describe('on pop state', () => {
      it('sends navigation event', () => {

        const onPreNavigate = jest.fn();
        const onNavigate = jest.fn();

        navigation.preNavigate(onPreNavigate);
        navigation.onNavigate(onNavigate);

        mockHref.mockImplementation(() => 'http://localhost/revisited');
        mockedWindow.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(onPreNavigate).not.toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const navigate = onNavigate.mock.calls[0][0] as NavigateEvent;

        expect(navigate.from.toString()).toBe('http://localhost/index');
        expect(navigate.to.toString()).toBe('http://localhost/revisited');
        expect(navigate.type).toBe('wesib:navigate');
        expect(navigate.action).toBe('return');
        expect(navigate.oldData).toBe('initial');
        expect(navigate.newData).toBe('popped');
      });
      it('updates location', () => {
        mockHref.mockImplementation(() => 'http://localhost/revisited');
        mockedWindow.dispatchEvent(new PopStateEvent('popstate', { state: 'popped' }));

        expect(location).toEqual({ url: 'http://localhost/revisited', data: 'popped' });
      });
    });
  });
});
