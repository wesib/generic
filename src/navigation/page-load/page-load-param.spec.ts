import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterEventOf, EventEmitter, eventInterest } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { NavigationSupport } from '../navigation-support.feature';
import { Page } from '../page';
import { PageParam } from '../page-param';
import { PageLoadAgent } from './page-load-agent';
import { PageLoadParam } from './page-load-param';
import { PageLoadRequest } from './page-load-request';
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
    let pageLoadParam: PageParam<void, PageLoadRequest>;

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
      pageLoadParam = context.get(PageLoadParam);
    });

    it('does not load page initial page', () => {
      page.put(pageLoadParam, { interest: eventInterest(), receiver });

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);

      expect(receiver).not.toHaveBeenCalled();
    });
    it('loads opened page', async () => {
      page.put(pageLoadParam, { interest: eventInterest(), receiver });

      await navigation.open('/other');

      const response = { ok: true, page } as PageLoadResponse;

      responder.send(response);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(receiver).toHaveBeenCalledTimes(1);
    });
    it('loads a page when returned to it', async () => {
      page.put(pageLoadParam, { interest: eventInterest(), receiver });

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
            is: () => afterEventOf({ ok: true, text: () => reject } as Response),
          },
          init(ctx) {
            ctx.whenReady(resolve);
          },
        })
        class MockFetchFeature {
        }

        context.load(MockFetchFeature)(noop);
      });

      page.put(pageLoadParam, { interest: eventInterest(), receiver });

      await navigation.open('/other');
      await reject.catch(noop);

      expect(receiver).toHaveBeenCalledWith({
        ok: false,
        page,
        error,
      });
    });
  });
});
