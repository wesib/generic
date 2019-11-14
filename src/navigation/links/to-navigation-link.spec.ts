import Mocked = jest.Mocked;
import { bootstrapComponents, BootstrapContext, ElementAdapter, Feature } from '@wesib/wesib';
import { Navigation } from '../navigation';
import { NavigationLinksSupport } from './navigation-links-support.feature';

describe('navigation', () => {
  describe('toNavigationLink', () => {

    let mockNavigation: Mocked<Navigation>;
    let bsContext: BootstrapContext;

    beforeEach(async () => {
      mockNavigation = {
        open: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
      } as any;

      @Feature({
        needs: NavigationLinksSupport,
        set: { a: Navigation, is: mockNavigation },
      })
      class TestFeature {}

      bsContext = await new Promise<BootstrapContext>(resolve => {

        const context = bootstrapComponents(TestFeature);

        context.whenReady(() => resolve(context));
      });
    });

    let adapt: ElementAdapter;

    beforeEach(() => {
      adapt = bsContext.get(ElementAdapter);
    });

    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('a');
    });

    it('enhances anchor element with `href` attribute', () => {
      adapt(element);

      const href = '/target';

      element.setAttribute('href', href);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('enhances any element with `href` attribute', () => {
      element = document.createElement('div');
      element.setAttribute('b-a', 'navigation-link');

      const href = '/target';

      element.setAttribute('href', href);

      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('enhances anchor element with `b-href` attribute', () => {
      adapt(element);

      const href = '/target';

      element.setAttribute('b-href', href);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('enhances any element with `b-href` attribute', () => {
      element = document.createElement('div');
      element.setAttribute('b-a', 'navigation-link');

      const href = '/target';

      element.setAttribute('b-href', href);

      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('enhances anchor element with `data-b-href` attribute', () => {
      adapt(element);

      const href = '/target';

      element.setAttribute('data-b-href', href);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('enhances eny element with `data-b-href` attribute', () => {
      element = document.createElement('div');
      element.setAttribute('b-a', 'navigation-link');

      const href = '/target';

      element.setAttribute('data-b-href', href);

      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith(href);
    });
    it('does not open new page by anchor element without attributes', () => {
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('does not enhance arbitrary element without behavior', () => {
      element = document.createElement('div');
      adapt(element);
      expect(click()).toBe(true);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('does not open new page by arbitrary element without attributes, but with behavior', () => {
      element = document.createElement('div');
      element.setAttribute('b-a', 'navigation-link');
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('does not enhance element with disabled behaviors', () => {
      element.setAttribute('href', '/target');
      element.setAttribute('b-a', '-');
      adapt(element);
      click();
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('does not enhance element with disabled navigation-link behavior', () => {
      element.setAttribute('href', '/target');
      element.setAttribute('b-a', '-navigation-link');
      adapt(element);
      click();
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('converts attribute to replacing navigation link', () => {

      const href = '/target';

      element.setAttribute('href', href);
      element.setAttribute('b-a', 'navigation-link:replace');
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.replace).toHaveBeenCalledWith(href);
    });
    it('does not replace the page by element without attributes', () => {
      element.setAttribute('b-a', 'navigation-link:replace');
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.replace).not.toHaveBeenCalled();
    });
    it('converts attribute to back navigation link', () => {
      element.setAttribute('b-a', 'navigation-link:back');
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.back).toHaveBeenCalled();
    });
    it('converts attribute to forward navigation link', () => {
      element.setAttribute('b-a', 'navigation-link:forward');
      adapt(element);
      expect(click()).toBe(false);
      expect(mockNavigation.forward).toHaveBeenCalled();
    });

    function click() {
      return element.dispatchEvent(new MouseEvent('click', { cancelable: true }));
    }

  });
});
