import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterThe, EventEmitter, eventSupply } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { NavigationSupport } from '../navigation-support.feature';
import { Page } from '../page';
import { PageLoadAgent } from './page-load-agent';
import { pageLoadParam } from './page-load-param';
import { PageLoadResponse } from './page-load-response';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('PageLoadParam', () => {

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock();
      (locationMock.window as any).DOMParser = DOMParser;
    });
    afterEach(() => {
      locationMock.down();
    });

    let responder: EventEmitter<[PageLoadResponse]>;
    let mockAgent: Mock<ReturnType<PageLoadAgent>, Parameters<PageLoadAgent>>;
    let receiver: Mock<void, [PageLoadResponse]>;

    beforeEach(() => {
      responder = new EventEmitter();
      mockAgent = jest.fn((_next, _request) => responder.on);
      receiver = jest.fn();
    });

    let context: BootstrapContext;
    let navigation: Navigation;
    let page: Page;

    beforeEach(async () => {
      @Feature({
        set: [
          { a: BootstrapWindow, is: locationMock.window },
          { a: PageLoadAgent, is: mockAgent },
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
      navigation.read(p => page = p);
    });

    it('does not load initial page', () => {
      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);

      expect(receiver).not.toHaveBeenCalled();
    });
    it('loads opened page', async () => {
      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      await navigation.open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(receiver).toHaveBeenCalledTimes(1);
    });
    it('reports opened page after parameterized navigation', async () => {
      await navigation.with(pageLoadParam, { supply: eventSupply(), receiver }).open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(receiver).toHaveBeenCalledTimes(1);
    });
    it('loads replacement page', async () => {
      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      await navigation.open('/other');
      await navigation.replace('./third');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(receiver).toHaveBeenCalledTimes(1);
    });
    it('loads page when returned to it', async () => {
      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      await navigation.open('/other');
      receiver.mockClear();
      navigation.back();

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(receiver).toHaveBeenCalledTimes(1);
    });
    it('reports page load error', async () => {
      mockAgent.mockImplementation(next => next());

      const error = new Error('reason');
      const reject = Promise.reject<string>(error);

      await new Promise(resolve => {
        @Feature({
          set: {
            a: HttpFetch,
            is: () => afterThe({ ok: true, text: () => reject } as Response),
          },
          init(ctx) {
            ctx.whenReady(resolve);
          },
        })
        class MockFetchFeature {
        }

        context.load(MockFetchFeature)(noop);
      });

      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      await navigation.open('/other');
      await reject.catch(noop);

      expect(receiver).toHaveBeenCalledWith({
        ok: false,
        page,
        error,
      });
    });
    it('reports loaded page to all receivers', async () => {

      const receiver2 = jest.fn();

      page.put(pageLoadParam, { supply: eventSupply(), receiver });
      page.put(pageLoadParam, { supply: eventSupply(), receiver: receiver2 });

      await navigation.open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver2).toHaveBeenCalledWith(response);
      expect(receiver2).toHaveBeenCalledTimes(1);
    });
    it('does not report already loaded page', async () => {
      page.put(pageLoadParam, { supply: eventSupply(), receiver });

      await navigation.open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);

      const receiver2 = jest.fn();

      page.put(pageLoadParam, { supply: eventSupply(), receiver: receiver2 });
      expect(receiver2).not.toHaveBeenCalled();
    });
    it('does not report to unregistered receivers', async () => {

      const supply = eventSupply();
      const receiver2 = jest.fn();

      page.put(pageLoadParam, { supply, receiver });
      page.put(pageLoadParam, { supply, receiver: receiver2 });

      await navigation.open('/other');
      supply.off();

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);

      expect(receiver).not.toHaveBeenCalled();
      expect(receiver2).not.toHaveBeenCalled();
    });
    it('does not load page when navigation cancelled', async () => {
      navigation.onLeave.once(event => event.preventDefault());
      await navigation.with(pageLoadParam, { supply: eventSupply(), receiver }).open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);

      expect(receiver).not.toHaveBeenCalled();
    });
  });
});
