import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { afterThe } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { pageLoadParam } from './page-load-param';
import { PageLoadSupport } from './page-load-support.feature';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('pageStyleAgent', () => {
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

    beforeEach(() => {
      navigation = context.get(Navigation);
    });

    it('applies loaded page style to document', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style.css"/>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');

      const styles = doc.querySelectorAll('link[rel=stylesheet]');

      expect(styles.length).toBe(1);

      const style = styles[0] as HTMLLinkElement;

      expect(style.href).toBe('http://localhost/css/style.css');
    });
    it('replaces document styles with the ones from loaded page', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style1.css"/>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');

      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style2.css"/>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/other');

      const styles = doc.querySelectorAll('link[rel=stylesheet]');

      expect(styles.length).toBe(1);

      const style = styles[0] as HTMLLinkElement;

      expect(style.href).toBe('http://localhost/css/style2.css');
    });
    it('does not alter document styles if loaded page has no ones', async () => {
      responseHtml = `
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style1.css"/>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/some');

      responseHtml = `
<html>
<head>
</head>
<body></body>
</html>`;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/other');

      const styles = doc.querySelectorAll('link[rel=stylesheet]');

      expect(styles.length).toBe(1);

      const style = styles[0] as HTMLLinkElement;

      expect(style.href).toBe('http://localhost/css/style1.css');
    });
  });
});
