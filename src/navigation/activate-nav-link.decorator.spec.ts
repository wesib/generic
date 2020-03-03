import {
  bootstrapComponents,
  BootstrapWindow,
  Component,
  ComponentContext,
  ComponentMount,
  DefaultRenderScheduler,
} from '@wesib/wesib';
import { EventKeeper, trackValue } from 'fun-events';
import { immediateRenderScheduler } from 'render-scheduler';
import { LocationMock } from '../spec/location-mock';
import { ElementNode } from '../tree';
import { ActivateNavLink, ActivateNavLinkDef } from './activate-nav-link.decorator';
import { Navigation } from './navigation';
import { Page } from './page';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('@ActivateNavLink', () => {

    let root: Element;

    beforeEach(() => {
      root = document.body.appendChild(document.createElement('nav-bar'));
    });
    afterEach(() => {
      root.remove();
    });

    let locationMock: LocationMock;

    beforeEach(() => {
      locationMock = new LocationMock({ win: window });
      jest.spyOn(document, 'baseURI', 'get').mockImplementation(() => locationMock.baseURI());
    });
    afterEach(() => {
      locationMock.down();
    });

    describe('activation by path', () => {

      let link1: HTMLAnchorElement;
      let link2: HTMLAnchorElement;
      let link3: HTMLAnchorElement;
      let activate: Mock;

      beforeEach(() => {
        link1 = addLink('index/path');
        link2 = addLink('index');
        link3 = addLink('other');
        activate = jest.fn();
      });

      it('activates nav link with longest matching URL', async () => {

        const { context } = await bootstrap({ activate });

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
        expect(activate).toHaveBeenCalledWith(
            true,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link2 }),
            }),
        );
        expect(activate).toHaveBeenCalledTimes(1);
      });
      it('activates multiple nav link with longest matching URL', async () => {
        link3.href = 'index';

        const { context } = await bootstrap({ activate });

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList.contains('active@b')).toBe(true);
        expect(activate).toHaveBeenCalledWith(
            true,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link2 }),
            }),
        );
        expect(activate).toHaveBeenCalledWith(
            true,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link3 }),
            }),
        );
        expect(activate).toHaveBeenCalledTimes(2);
      });
      it('moves active nav link after navigation', async () => {

        const { context } = await bootstrap({ activate });
        const navigation = context.get(Navigation);

        activate.mockClear();

        const page = await navigation.open('index/path');

        expect(link1.classList.contains('active@b')).toBe(true);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
        expect(activate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link2 }),
            }),
        );
        expect(activate).toHaveBeenCalledWith(
            true,
            {
              context,
              page,
              node: expect.objectContaining({ element: link1 }),
            },
        );
        expect(activate).toHaveBeenCalledTimes(2);
      });
      it('does not deactivate nav link after navigation to matching page', async () => {

        const { context } = await bootstrap({ activate });
        const navigation = context.get(Navigation);

        await navigation.open('index/other');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
        expect(activate).toHaveBeenCalledTimes(1);
      });
      it('deactivates all links when navigated to non-matching location', async () => {

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('non-matching');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
      });
      it('never activates nav link without href', async () => {
        link3.removeAttribute('href');

        const { context } = await bootstrap({ activate });
        const navigation = context.get(Navigation);

        activate.mockClear();
        await navigation.open('');

        expect(link3.classList).toHaveLength(0);
        expect(activate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link2 }),
            }),
        );
        expect(activate).toHaveBeenCalledTimes(1);
      });
      it('never activates nav link with another origin', async () => {
        link3.href = 'https://test.com/';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('');

        expect(link3.classList).toHaveLength(0);
      });
      it('moves active nav link after removing active one', async () => {

        const { context } = await bootstrap({ activate });
        const navigation = context.get(Navigation);
        const page = await navigation.open('index/path');

        activate.mockClear();
        link1.remove();
        await Promise.resolve();

        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
        expect(activate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link1 }),
            }),
        );
        expect(activate).toHaveBeenCalledWith(
            true,
            {
              context,
              page,
              node: expect.objectContaining({ element: link2 }),
            },
        );
        expect(activate).toHaveBeenCalledTimes(2);
      });
      it('moves active nav link after adding more suitable one', async () => {

        const { context } = await bootstrap({ activate });
        const navigation = context.get(Navigation);
        const page = await navigation.open('index?some=other');

        activate.mockClear();

        const link4 = addLink('index?some=other');

        await Promise.resolve();

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
        expect(link4.classList.contains('active@b')).toBe(true);
        expect(activate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({
              context,
              node: expect.objectContaining({ element: link2 }),
            }),
        );
        expect(activate).toHaveBeenCalledWith(
            true,
            {
              context,
              page,
              node: expect.objectContaining({ element: link4 }),
            },
        );
        expect(activate).toHaveBeenCalledTimes(2);
      });
    });

    describe('activation by search parameters', () => {

      let link1: HTMLAnchorElement;
      let link2: HTMLAnchorElement;
      let link3: HTMLAnchorElement;

      beforeEach(() => {
        link1 = addLink('index?a=1');
        link2 = addLink('index?a=1&b=2&b=3');
        link3 = addLink('index?a=1&b=2');
      });

      it('activates nav link with all matching parameters', async () => {

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?b=2&a=1&b=3');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
      });
      it('activates nav link with most matching parameters', async () => {

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?b=2&a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList.contains('active@b')).toBe(true);
      });
      it('does not activate nav link with different search parameters', async () => {
        link3.href = 'index?a=1&b=33';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?a=1&b=2');

        expect(link1.classList.contains('active@b')).toBe(true);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
      });
      it('ignores double-underscored parameters', async () => {
        link3.href = 'index?a=1&b=2&__ignore__=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?b=2&a=1&__ignore__=2');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList.contains('active@b')).toBe(true);
      });
      it('activates nav link with the same dir path', async () => {
        link1.href = 'index/?a=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?a=1');

        expect(link1.classList.contains('active@b')).toBe(true);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
      });
      it('does not activate nav link with different path', async () => {
        link1.href = 'other?a=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('index?a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link1.classList).toHaveLength(0);
      });
    });

    describe('activation by hash parameters', () => {

      let link1: HTMLAnchorElement;
      let link2: HTMLAnchorElement;
      let link3: HTMLAnchorElement;

      beforeEach(() => {
        link1 = addLink('path#hash?a=1');
        link2 = addLink('path#hash?a=1&b=2&b=3');
        link3 = addLink('path#hash?a=1&b=2');
      });

      it('activates nav link with matching hash', async () => {

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('path#hash/?b=2&a=1&b=3');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
      });
      it('activates nav link with matching hash and search parameters', async () => {
        link1 = addLink('path?foo=bar#/hash?a=1');
        link2 = addLink('path?foo=bar#/hash?a=1&b=2&b=3');
        link3 = addLink('path?foo=bar#/hash?a=1&b=2');

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('path?foo=bar#hash/?b=2&a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList.contains('active@b')).toBe(true);
      });
      it('does not activate nav link with different path', async () => {
        link1.href = 'other?a=1#hash?a=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('other#hash?a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link1.classList).toHaveLength(0);
      });
      it('does not activate nav link with lesser search params', async () => {
        link1.href = 'path?foo=1#hash?a=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('path?foo=1&bar=2#index?a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link1.classList).toHaveLength(0);
      });
      it('does not activate nav link with more search params', async () => {
        link1.href = 'path?foo=1&bar=2&bar=3#hash?a=1';

        const { context } = await bootstrap();
        const navigation = context.get(Navigation);

        await navigation.open('path?foo=1&bar=2#index?a=1');

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link1.classList).toHaveLength(0);
      });
    });

    describe('activation with custom weighing', () => {

      let link1: HTMLAnchorElement;
      let link2: HTMLAnchorElement;
      let link3: HTMLAnchorElement;
      let weigh: Mock<
          number | EventKeeper<[number]>,
          [{ page: Page; context: ComponentContext; node: ElementNode }]>;

      beforeEach(() => {
        link1 = addLink('1');
        link2 = addLink('2');
        link3 = addLink('3');
        weigh = jest.fn(({ node: { element: { href } } }) => href.includes('2') ? 1 : 0);
      });

      it('activates nav link with highest weights', async () => {
        await bootstrap({ weigh });

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);
      });
      it('moves activate nav link when weight updated', async () => {

        const w1 = trackValue(1);
        const w2 = trackValue(2);
        const w3 = trackValue(0);

        weigh.mockImplementation(({ node: { element: { href } } }) => {
          if (href.includes('1')) {
            return w1;
          }
          if (href.includes('2')) {
            return w2;
          }
          if (href.includes(3)) {
            return w3;
          }
          return 0;
        });

        await bootstrap({ weigh });

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);

        w3.it = 3;
        expect(link1.classList).toHaveLength(0);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList.contains('active@b')).toBe(true);
      });
      it('moves activate nav link when weight cut off', async () => {

        const w1 = trackValue(1);
        const w2 = trackValue(2);
        const w3 = trackValue(0.5);
        weigh.mockImplementation(({ node: { element: { href } } }) => {
          if (href.includes('1')) {
            return w1;
          }
          if (href.includes('2')) {
            return w2;
          }
          if (href.includes(3)) {
            return w3;
          }
          return 0;
        });

        await bootstrap({ weigh });

        expect(link1.classList).toHaveLength(0);
        expect(link2.classList.contains('active@b')).toBe(true);
        expect(link3.classList).toHaveLength(0);

        w2.done();
        expect(link1.classList.contains('active@b')).toBe(true);
        expect(link2.classList).toHaveLength(0);
        expect(link3.classList).toHaveLength(0);
      });
    });

    function addLink(href: string, parent = root): HTMLAnchorElement {

      const link = parent.appendChild(document.createElement('a'));

      link.href = href;

      return link;
    }

    async function bootstrap(def?: ActivateNavLinkDef): Promise<ComponentMount> {

      @Component(
          {
            feature: {
              setup(setup) {
                setup.provide({ a: BootstrapWindow, is: locationMock.window });
                setup.provide({ a: DefaultRenderScheduler, is: immediateRenderScheduler });
              },
            },
          },
          ActivateNavLink(def),
      )
      class TestComponent {}

      const bsContext = await new Promise(bootstrapComponents(TestComponent).whenReady);
      const factory = await bsContext.whenDefined(TestComponent);

      return factory.mountTo(root);
    }
  });
});
