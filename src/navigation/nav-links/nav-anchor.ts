import { DomEventDispatcher } from '@frontmeans/dom-events';
import { css__naming, QualifiedName } from '@frontmeans/namespace-aliaser';
import { EventReceiver } from '@proc7ts/fun-events';
import { setOfElements, valueByRecipe } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DefaultNamespaceAliaser, ElementRenderScheduler, RenderDef, Wesib__NS } from '@wesib/wesib';
import { Navigation } from '../navigation';
import { NavLink } from './nav-link';

type GenericElement = Element;

export namespace NavAnchor {

  /**
   * Anchor element.
   */
  export interface Element extends GenericElement {

    /**
     * Hyper-reference of this anchor.
     */
    readonly href: string;

  }

  /**
   * Navigation anchor construction options.
   */
  export interface Options {

    /**
     * Type or types of events to handle.
     *
     * `click` by default.
     */
    readonly event?: string | readonly string[];

    /**
     * Qualified name of CSS class to mark the active anchor element with.
     *
     * The `active` class in Wesib namespace is used by default.
     */
    readonly active?: QualifiedName;

    /**
     * Rendering definition options to pass to nav links render scheduler.
     */
    readonly render?: RenderDef.Options;

  }

}

const NavAnchor$activeClass: QualifiedName = ['active', Wesib__NS];

/**
 * Creates navigation link for the given anchor element.
 *
 * @param element - Either an anchor element, or a function returning one by the given navigation link owner.
 * @param options - Custom anchor options.
 *
 * @returns Navigation link provider.
 */
export function navAnchor(
    element:
        | NavAnchor.Element
        | ((this: void, owner: NavLink.Owner) => NavAnchor.Element),
    options?: NavAnchor.Options,
): (this: void, owner: NavLink.Owner) => NavLink;

/**
 * Optionally creates navigation link for the given anchor element.
 *
 * @param element - Either an anchor element, or a function returning one by the given navigation link owner,
 * or nothing.
 * @param options - Custom anchor options.
 *
 * @returns Navigation link provider.
 */
export function navAnchor(
    element:
        | NavAnchor.Element
        | ((this: void, owner: NavLink.Owner) => NavAnchor.Element | null | undefined)
        | null
        | undefined,
    options?: NavAnchor.Options,
): NavLink.Provider;

export function navAnchor(
    element:
        | NavAnchor.Element
        | ((this: void, owner: NavLink.Owner) => NavAnchor.Element | null | undefined)
        | null
        | undefined,
    options: NavAnchor.Options = {},
): NavLink.Provider {

  const events = setOfElements(options.event || 'click');
  const { active = NavAnchor$activeClass } = options;
  let activeClass: string;

  return owner => {

    const anchor = valueByRecipe(element, owner);

    if (!anchor) {
      return;
    }

    const { context, supply: ownerSupply = context.supply } = owner;

    activeClass = css__naming.name(active, context.get(DefaultNamespaceAliaser));

    const navigation = context.get(Navigation);
    const scheduler = context.get(ElementRenderScheduler);
    const schedule = scheduler(options.render);
    const supply = new Supply().needs(ownerSupply);
    const handleClick: EventReceiver<[Event]> = {
      supply,
      receive(_ctx, event) {

        const { href } = anchor;
        const pageURL = navigation.page.url;
        const url = new URL(href, anchor.ownerDocument.baseURI);

        if (url.origin !== pageURL.origin) {
          return; // External link
        }

        event.preventDefault();
        if (pageURL.href !== url.href) {
          navigation.open(href).catch(console.error);
        }
      },
    };
    const eventDispatcher = new DomEventDispatcher(anchor);

    supply.cuts(eventDispatcher);
    for (const event of events) {
      eventDispatcher.on(event)(handleClick);
    }

    return ({

      get href(): string {
        return anchor!.href;
      },

      supply,

      activate() {
        schedule(() => {
          anchor.classList.add(activeClass);
        });

        return new Supply(() => {
          schedule(() => {
            anchor.classList.remove(activeClass);
          });
        });
      },

    });
  };
}
