import { bootstrapComponents, BootstrapWindow, Component, ComponentMount, DefaultRenderScheduler } from '@wesib/wesib';
import { valueProvider } from 'call-thru';
import { afterThe } from 'fun-events';
import { immediateRenderScheduler } from 'render-scheduler';
import { HttpFetch } from '../../fetch';
import { LocationMock } from '../../spec/location-mock';
import { Navigation } from '../navigation';
import { IncludePage, IncludePageDef } from './include-page.decorator';
import { PageLoadAgent } from './page-load-agent';
import { PageLoadParam } from './page-load-param';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('@IncludePage', () => {

    let element: Element;

    beforeEach(() => {
      element = document.body.appendChild(document.createElement('page-content'));
    });
    afterEach(() => {
      element.remove();
      element.innerHTML = 'original content';
    });

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock({ win: window, doc: document });
    });
    afterEach(() => {
      locationMock.down();
    });

    let html: string;
    let mockFetch: Mock<ReturnType<HttpFetch>, Parameters<HttpFetch>>;
    let mockAgent: Mock<ReturnType<PageLoadAgent>, Parameters<PageLoadAgent>>;

    beforeEach(() => {
      html = '<page-content></page-content>';
      mockFetch = jest.fn((_input, _init?) => afterThe(
          {
            ok: true,
            headers: new Headers(),
            text: () => Promise.resolve(`<html lang="en"><body>${html}</body></html>`),
          } as Response,
      ));
      mockAgent = jest.fn((next, _request) => next());
    });

    it('includes loaded page fragment', async () => {
      html = '<page-content>included content</page-content>';

      const { context } = await bootstrap();
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('page');
      });

      expect(element.textContent).toBe('included content');
    });
    it('includes identified page fragment', async () => {
      html = `
<page-content>not included content</page-content>
<page-fragment id="test">included content</page-fragment>
`;
      element.id = 'test';

      const { context } = await bootstrap();
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('page');
      });

      expect(element.textContent).toBe('included content');
    });
    it('includes requested page fragment', async () => {
      html = `
<page-content>not included content</page-content>
<requested-fragment>included content</requested-fragment>
`;
      const { context } = await bootstrap({ fragment: { tag: 'requested-fragment' } });
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('page');
      });

      expect(element.textContent).toBe('included content');
    });
    it('clears content if requested fragment not loaded', async () => {
      html = `
<other-fragment>included content</other-fragment>
`;

      const { context } = await bootstrap({ fragment: { tag: 'requested-fragment' } });
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('page');
      });

      expect(element.childNodes).toHaveLength(0);
    });
    it('reports page load progress', async () => {
      html = '<page-content>included content</page-content>';

      const onResponse = jest.fn();
      const { context } = await bootstrap({ onResponse });
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('page');
      });

      expect(onResponse).toHaveBeenLastCalledWith({
        context,
        response: expect.objectContaining({ ok: true }),
        range: expect.any(Range),
      });
      expect(onResponse).toHaveBeenCalledTimes(2);
    });
    it('does not refresh included content if only URL hash changed', async () => {
      html = '<page-content>included content</page-content>';

      const onResponse = jest.fn();
      const { context } = await bootstrap({ onResponse });
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open(new URL('#another-hash', navigation.page.url));
      });

      expect(onResponse).not.toHaveBeenCalled();
    });
    it('does not refresh included content if content key did not change', async () => {
      html = '<page-content>included content</page-content>';

      const onResponse = jest.fn();
      const { context } = await bootstrap({ onResponse, contentKey: valueProvider('same') });
      const navigation = context.get(Navigation);

      await new Promise(resolve => {
        navigation.with(
            PageLoadParam,
            {
              receiver: r => r.ok && resolve(),
            },
        ).open('other');
      });

      expect(onResponse).not.toHaveBeenCalled();
    });

    async function bootstrap(def?: IncludePageDef): Promise<ComponentMount> {

      @Component(
          {
            feature: {
              setup(setup) {
                setup.provide({ a: BootstrapWindow, is: locationMock.window });
                setup.provide({ a: DefaultRenderScheduler, is: immediateRenderScheduler });
                setup.provide({ a: HttpFetch, is: mockFetch });
                setup.provide({ a: PageLoadAgent, is: mockAgent });
              },
            },
          },
          IncludePage(def),
      )
      class PageContent {}

      const bsContext = await bootstrapComponents(PageContent).whenReady();
      const factory = await bsContext.whenDefined(PageContent);

      return factory.mountTo(element);
    }

  });
});
