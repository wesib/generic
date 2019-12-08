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

      const base = doc.createElement('base');

      base.href = 'http://localhost/index';
      doc.head.appendChild(base);

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

    it('applies loaded page style to document', async () => {
      await loadHtml(`
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style.css"/>
</head>
<body></body>
</html>`);

      const styles = documentStyles();

      expect(styles.length).toBe(1);
      expect(styles[0].href).toBe('http://localhost/css/style.css');
    });
    it('replaces document styles with the ones from loaded page', async () => {
      appendStyle('css/style1.css');
      await loadHtml(`
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style2.css"/>
</head>
<body></body>
</html>`);

      const styles = documentStyles();

      expect(styles.length).toBe(1);
      expect(styles[0].href).toBe('http://localhost/css/style2.css');
    });
    it('does not alter document styles if loaded page has no ones', async () => {
      appendStyle('css/style1.css');
      await loadHtml(`
<html>
<head>
</head>
<body></body>
</html>`);

      const styles = documentStyles();

      expect(styles.length).toBe(1);
      expect(styles[0].href).toBe('http://localhost/css/style1.css');
    });
    it('reuses existing styles', async () => {
      appendStyle('css/style1.css', doc.body);

      const oldStyle = documentStyles(doc.body)[0];

      await loadHtml(`
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style1.css"/>
</head>
<body></body>
</html>`);

      const styles = documentStyles(doc.body);

      expect(styles.length).toBe(1);
      expect(styles[0].href).toBe('http://localhost/css/style1.css');
      expect(styles[0]).toBe(oldStyle);
    });
    it('reorders existing styles', async () => {
      appendStyle('css/style1.css', doc.body);
      appendStyle('css/style2.css', doc.body);

      const oldStyles = documentStyles(doc.body);

      await loadHtml(`
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style2.css"/>
<link rel="stylesheet" href="css/style1.css"/>
</head>
<body></body>
</html>`);

      const styles = documentStyles(doc.body);

      expect(styles.length).toBe(2);
      expect(styles[0].href).toBe('http://localhost/css/style2.css');
      expect(styles[0]).toBe(oldStyles[1]);
      expect(styles[1].href).toBe('http://localhost/css/style1.css');
      expect(styles[1]).toBe(oldStyles[0]);
    });
    it('respects old styles', async () => {
      appendStyle('css/style2.css', doc.body);

      const oldStyle = documentStyles(doc.body)[0];

      await loadHtml(`
<html>
<head>
<base href="http://localhost/"/>
<link rel="stylesheet" href="css/style1.css"/>
<link rel="stylesheet" href="css/style2.css"/>
<link rel="stylesheet" href="css/style3.css"/>
</head>
<body></body>
</html>`);

      const styles = documentStyles(doc.body);

      expect(styles.length).toBe(3);
      expect(styles[0].href).toBe('http://localhost/css/style1.css');
      expect(styles[1].href).toBe('http://localhost/css/style2.css');
      expect(styles[1]).toBe(oldStyle);
      expect(styles[2].href).toBe('http://localhost/css/style3.css');
    });

    function appendStyle(href: string, parent: Node = doc.head) {

      const link = doc.createElement('link');

      link.href = href;
      link.rel = 'stylesheet';

      parent.appendChild(link);
    }

    async function loadHtml(html: string) {
      responseHtml = html;
      await navigation.with(pageLoadParam, { receiver: noop }).open('/other');
    }

    function documentStyles(parent: Element = doc.head) {
      return parent.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]');
    }
  });
});
