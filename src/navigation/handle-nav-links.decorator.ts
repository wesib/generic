/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { ArraySet, Class, Component, ComponentClass, ComponentContext, ComponentDecorator } from '@wesib/wesib';
import { Navigation } from './navigation';

/**
 * Creates component decorator that handles events (e.g. clicks) on navigation links.
 *
 * Such events would lead to {@link @Navigation navigation actions} instead of default ones.
 */
export function HandleNavLinks<T extends ComponentClass = Class>(
    def: HandleNavLinksDef = {},
): ComponentDecorator<T> {

  const handle = def.handle ? def.handle.bind(def) : defaultHandleNavLinks;
  const events = new ArraySet(def.event || 'click');

  return Component({
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

export interface HandleNavLinksDef {

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
   * it {@link Navigation.open opens} a page at this URL instead of default action.
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
        context: ComponentContext;
      },
  ): void;

}

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
  navigation.open(href);
}
