import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterThe } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { pageLoadParam } from './page-load-param';
import { PageLoadResponse } from './page-load-response';
import { PageLoadSupport } from './page-load-support.feature';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('pageScriptsAgent', () => {

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

    let responseHtml: string;
    let mockFetch: Mock<ReturnType<HttpFetch>, Parameters<HttpFetch>>;
    let context: BootstrapContext;

    beforeEach(async () => {
      responseHtml = '<html></html>';
      mockFetch = jest.fn((_input, _init?) => afterThe({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve(responseHtml),
      } as Response));

      @Feature({
        needs: PageLoadSupport,
        setup(setup) {
          setup.provide({ a: BootstrapWindow, is: locationMock.window });
          setup.provide({ a: HttpFetch, is: mockFetch });
        },
      })
      class TestFeature {}

      context = await new Promise(resolve => {

        const bsContext = bootstrapComponents(TestFeature);

        bsContext.whenReady(() => resolve(bsContext));
      });

    });

    let navigation: Navigation;

    beforeEach(() => {
      navigation = context.get(Navigation);
    });

    it('appends loaded page scripts to document', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<script src="js/test.js" type="module"></script>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');
      expect(doc.scripts).toHaveLength(1);

      const script = doc.scripts[0];

      expect(script.src).toBe('http://localhost/js/test.js');
      expect(script.type).toBe('module');
    });
    it('does not appends loaded page scripts for the second time', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<script src="js/test.js" type="module"></script>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');

      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<script src="js/test.js" type="module"></script>
<script src="js/test2.js" type="module"></script>
</head>
<body></body>
</html>`;

      await navigation.open('/other');

      expect(doc.scripts).toHaveLength(2);
      expect(doc.scripts[0].src).toBe('http://localhost/js/test.js');
      expect(doc.scripts[1].src).toBe('http://localhost/js/test2.js');
    });
    it('does not appends inline script to document', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<script>alert('!');</script>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');
      expect(doc.scripts).toHaveLength(0);
    });
    it('passes error messages through', async () => {
      mockFetch.mockImplementation(() => afterThe({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/unknown' }),
        text: () => Promise.resolve(responseHtml),
      } as Response));

      let response!: PageLoadResponse;

      await navigation.with(pageLoadParam, { receiver: r => response = r }).open('/other');

      expect(response).toMatchObject({ ok: false });
    });
  });
});
