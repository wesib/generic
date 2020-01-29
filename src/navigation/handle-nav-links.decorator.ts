/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { ArraySet, Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { Navigation } from './navigation';
import { NavigationSupport } from './navigation-support.feature';

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

  const handle = def.handle ? def.handle.bind(def) : defaultHandleNavLinks;
  const events = new ArraySet(def.event || 'click');

  return Component({
    feature: {
      needs: NavigationSupport,
    },
    define(defContext) {
      defContext.whenComponent(context => {
        context.whenOn(connectSupply => {

          const navigation = context.get(Navigation);

          events.forEach(eventType => {
            context.on(eventType)(event => handle({
              event,
              context,
              navigation,
            })).needs(connectSupply);
          });
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
   * @param event  An event to handle.
   * @param navigation  Navigation service to use.
   * @param context  Component context.
   */
  handle?(
      {
        event,
        navigation,
        context,
      }: {
        event: Event;
        navigation: Navigation;
        context: ComponentContext<T>;
      },
  ): void;

}

/**
 * @internal
 */
function defaultHandleNavLinks(
    {
      event,
      navigation,
    }: {
      event: Event;
      navigation: Navigation;
    },
): void {

  const target = event.target as HTMLAnchorElement;
  const href = target.getAttribute('href');

  if (href == null) {
    return;
  }

  const base = new URL(target.ownerDocument!.baseURI);
  const url = new URL(href, base);

  if (url.origin !== base.origin) {
    return; // External link
  }

  event.preventDefault();
  if (base.href !== url.href) {
    navigation.open(href);
  }
}
