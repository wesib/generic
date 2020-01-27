import { bootstrapComponents, ComponentMount, Feature } from '@wesib/wesib';
import { HandleNavLinks, HandleNavLinksDef } from './handle-nav-links.decorator';
import { Navigation } from './navigation';
import Mocked = jest.Mocked;

describe('navigation', () => {
  describe('@HandleNavLinks', () => {

    let baseURI: string;
    let element: Element;
    let anchor: HTMLAnchorElement;

    beforeEach(() => {
      element = document.body.appendChild(document.createElement('test-element'));
      anchor = element.appendChild(document.createElement('a'));
      baseURI = 'http://localhost.localdomain:8888';
      jest.spyOn(document, 'baseURI', 'get').mockImplementation(() => baseURI);
    });
    afterEach(() => {
      element.remove();
    });

    let mockNavigation: Mocked<Navigation>;

    beforeEach(() => {
      mockNavigation = {
        open: jest.fn(),
      } as any;
    });

    it('navigates on anchor click instead of default action', async () => {
      anchor.href = '/test';
      await bootstrap();

      const event = new KeyboardEvent('click', { bubbles: true, cancelable: true });

      expect(anchor.dispatchEvent(event)).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith('/test');
    });
    it('does not navigate if anchor href is absent', async () => {
      await bootstrap();

      const event = new KeyboardEvent('click', { bubbles: true, cancelable: true });

      expect(anchor.dispatchEvent(event)).toBe(true);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('does not navigate if anchor href has another origin', async () => {
      anchor.href = 'https://localhost.localdomain';
      await bootstrap();

      const event = new KeyboardEvent('click', { bubbles: true, cancelable: true });

      expect(anchor.dispatchEvent(event)).toBe(true);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('handles expected event', async () => {
      anchor.href = '/test';
      await bootstrap({ event: 'test:click' });

      const event = new KeyboardEvent('test:click', { bubbles: true, cancelable: true });

      expect(anchor.dispatchEvent(event)).toBe(false);
      expect(mockNavigation.open).toHaveBeenCalledWith('/test');
    });
    it('does not handle unexpected event', async () => {
      anchor.href = '/test';
      await bootstrap({ event: 'test:click' });

      const event = new KeyboardEvent('click', { bubbles: true, cancelable: true });

      expect(anchor.dispatchEvent(event)).toBe(true);
      expect(mockNavigation.open).not.toHaveBeenCalled();
    });
    it('handles event using provided handler', async () => {

      const mockHandler = jest.fn();

      anchor.href = '/test';

      const { context } = await bootstrap({ handle: mockHandler });
      const event = new KeyboardEvent('click', { bubbles: true, cancelable: true });

      anchor.dispatchEvent(event);
      expect(mockHandler).toHaveBeenCalledWith({
        event,
        context,
        navigation: context.get(Navigation),
      });
    });

    async function bootstrap(def?: HandleNavLinksDef): Promise<ComponentMount> {

      @HandleNavLinks(def)
      @Feature({
        setup(setup) {
          setup.provide({ a: Navigation, is: mockNavigation });
        },
      })
      class TestComponent {}

      const bsContext = await new Promise(bootstrapComponents(TestComponent).whenReady);
      const factory = await bsContext.whenDefined(TestComponent);

      return factory.mountTo(element);
    }
  });
});
