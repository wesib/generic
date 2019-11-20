import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterThe } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { appRevSearchParam } from './page-cache-buster.impl';
import { pageLoadParam } from './page-load-param';
import { PageLoadSupport } from './page-load-support.feature';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

describe('navigation', () => {
  describe('PageCacheBuster', () => {

    let doc: Document;
    let locationMock: LocationMock;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
      jest.spyOn(doc, 'baseURI', 'get').mockImplementation(() => 'http://localhost/index');
      locationMock = new LocationMock({ doc });
      (locationMock.window as any).DOMParser = DOMParser;
    });
    afterEach(() => {
      locationMock.down();
    });

    let pageRev: string;

    beforeEach(() => {
      pageRev = 'page-rev';

      const meta = doc.createElement('meta');
      meta.name = 'wesib-app-rev';
      meta.content = pageRev;

      doc.head.appendChild(meta);
    });

    let responseRev: string;
    let responseHtml: () => string;
    let mockFetch: Mock<ReturnType<HttpFetch>, Parameters<HttpFetch>>;
    let context: BootstrapContext;

    beforeEach(async () => {
      responseRev = pageRev;
      responseHtml = () => `<html><head><meta name="wesib-app-rev" content="${responseRev}"></head></html>`;
      mockFetch = jest.fn((_input, _init?) => afterThe({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve(responseHtml()),
      } as Response));

      @Feature({
        needs: PageLoadSupport,
        set: [
          { a: BootstrapWindow, is: locationMock.window },
          { a: HttpFetch, is: mockFetch },
        ],
      })
      class TestFeature {}

      context = await new Promise(resolve => {

        const bsContext = bootstrapComponents(TestFeature);

        bsContext.whenReady(() => resolve(bsContext));
      });

    });

    let navigation: Navigation;
    let replaceSpy: SpyInstance;
    let reloadSpy: SpyInstance;

    beforeEach(() => {
      navigation = context.get(Navigation);
      replaceSpy = jest.spyOn(navigation, 'replace');
      replaceSpy.mockImplementation(() => Promise.resolve());
      reloadSpy = jest.spyOn(navigation, 'reload');
    });

    it('sends page revision as search parameter', async () => {
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some?q=v');

      const request = mockFetch.mock.calls[0][0] as Request;

      expect(request.url).toBe(`http://localhost/some?q=v&${appRevSearchParam}=${pageRev}`);
    });
    it('does not reload current page if loaded page revision is the same', async () => {

      await navigation.with(pageLoadParam, { receiver: noop }).open('/some?q=v');
      await new Promise(resolve => setTimeout(resolve));

      expect(replaceSpy).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
    it('does not reload current page if loaded page revision is empty', async () => {
      responseRev = '';

      await navigation.with(pageLoadParam, { receiver: noop }).open('/some?q=v');
      await new Promise(resolve => setTimeout(resolve));

      expect(replaceSpy).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
    it('reloads current page if loaded page revision differs', async () => {
      responseRev = 'updated-rev';

      await navigation.with(pageLoadParam, { receiver: noop }).open('/some?q=v');
      await new Promise(resolve => setTimeout(resolve));

      expect(replaceSpy).toHaveBeenCalledWith(`?q=v&${appRevSearchParam}=${responseRev}`);
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });
});
