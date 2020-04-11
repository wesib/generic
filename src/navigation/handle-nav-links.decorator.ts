/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { ArraySet, Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { Navigation } from './navigation';
import { NavigationSupport } from './navigation-support.feature';
import { Page } from './page';

/**
 * Creates component decorator that handles events (e.g. clicks) on navigation links.
 *
 * Such events would lead to {@link @Navigation navigation actions} instead of default ones.
 *
 * Enables [[NavigationSupport]] feature.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Navigation links handler definition.
 *
 * @returns New component decorator.
 */
export function HandleNavLinks<T extends ComponentClass = Class>(
    def: HandleNavLinksDef<InstanceType<T>> = {},
): ComponentDecorator<T> {

  const handle = def.handle ? def.handle.bind(def) : defaultHandleNavLinks(def);
  const events = new ArraySet(def.event || 'click');

  return Component({
    feature: {
      needs: NavigationSupport,
    },
    define(defContext) {
      defContext.whenComponent(context => {
        context.whenConnected(() => {

          const navigation = context.get(Navigation);

          for (const eventType of events) {
            context.on(eventType).to(event => {
              navigation.read().once(
                  page => handle({
                    event,
                    page,
                    context,
                    navigation,
                  }),
              );
            });
          }
        });
      });
    },
  });
}

/**
 * Navigation links handler definition.
 *
 * @typeparam T  A type of component.
 */
export interface HandleNavLinksDef<T extends object = any> {

  /**
   * Type or types of events to handle.
   *
   * `click` by default.
   */
  readonly event?: string | readonly string[];

  /**
   * Handles event by performing navigation action.
   *
   * Every {@link event} sent by one of elements inside decorated component is passed to this function. In response
   * it may perform a navigation event.
   *
   * By default handles events on anchor tags. When such tag contains an `href` attribute containing same-origin URL
   * it {@link Navigation.open opens} a page at this URL instead of default action. It also prevents navigation
   * if URL didn't change.
   *
   * @param event  A click event to handle.
   * @param page  Current navigation page.
   * @param navigation  Navigation service to use.
   * @param context  Component context.
   */
  handle?(
      {
        event,
        page,
        navigation,
        context,
      }: {
        event: Event;
        page: Page;
        navigation: Navigation;
        context: ComponentContext<T>;
      },
  ): void;

  /**
   * Extracts hyper-reference of clicked element.
   *
   * Extracts hyper-reference from `href` attribute of event target.
   *
   * @param event  A click event to handle.
   *
   * @returns Extracted hyper-reference, or nothing if it can not be extracted. Event will be ignored in this case.
   */
  href?(event: Event): string | undefined | null;

}

/**
 * @internal
 */
function defaultNavLinkHref(event: Event): string | null {

  const target = event.target as Element;

  return target.getAttribute('href');
}

/**
 * @internal
 */
function defaultHandleNavLinks(
    def: HandleNavLinksDef,
): (
    opts: {
      event: Event;
      page: Page;
      navigation: Navigation;
    },
) => void {

  const getHref = def.href ? def.href.bind(def) : defaultNavLinkHref;

  return ({
    event,
    page,
    navigation,
  }) => {

    const href = getHref(event);

    if (href == null) {
      return;
    }

    const target = event.target as Element;
    const pageURL = page.url;
    const url = new URL(href, target.ownerDocument!.baseURI);

    if (url.origin !== pageURL.origin) {
      return; // External link
    }

    event.preventDefault();
    if (pageURL.href !== url.href) {
      navigation.open(href);
    }
  };
}
