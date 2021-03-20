import {
  afterAll,
  AfterEvent,
  afterThe,
  consumeEvents,
  isAfterEvent,
  trackValue,
  translateAfter_,
} from '@proc7ts/fun-events';
import { valueByRecipe } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { BootstrapWindow, ComponentContext } from '@wesib/wesib';
import { getHashURL } from '../hash-url';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { NavLink } from './nav-link';

const NavMenu$Links__symbol = (/*#__PURE__*/ Symbol('NavMenu.links'));

export class NavMenu {

  /**
   * @internal
   */
  private readonly [NavMenu$Links__symbol]: NavMenu$Links;

  constructor(
      readonly context: ComponentContext,
      links:
          | Iterable<NavLink | NavLink.Provider>
          | AfterEvent<(NavLink | NavLink.Provider)[]>
          | ((this: void, menu: NavMenu) =>
          | Iterable<NavLink | NavLink.Provider>
          | AfterEvent<(NavLink | NavLink.Provider)[]>),
      options?: NavMenu.Options,
  ) {
    this[NavMenu$Links__symbol] = new NavMenu$Links(this, options);

    const linkValues = valueByRecipe<
        Iterable<NavLink | NavLink.Provider> | AfterEvent<(NavLink | NavLink.Provider)[]>,
        [NavMenu]>(links, this);
    const afterLinks: AfterEvent<(NavLink | NavLink.Provider)[]> = isAfterEvent(linkValues)
        ? linkValues
        : afterThe(linkValues).do(
            translateAfter_((send, links) => send(...links)),
        );
    afterLinks.do(consumeEvents((...links) => {
      this[NavMenu$Links__symbol].replace(links);
    }));
  }

}

export namespace NavMenu {

  export interface Options {

    /**
     * Weighs matching navigation link.
     *
     * This method will be called for each navigation link on each current page update.
     *
     * By default:
     * 1. If the link path has neither hash, nor search parameters, then:
     * 1.1. Checks whether page URL path starts with the link's one.
     * 1.2. If so, then uses link path length as weight.
     * 2. If the link path has search parameters, but has no hash, then requires the page path to be the same as link's
     *    one, and page search parameters include all of the link's ones. The number of link search parameters plus the
     *    link path length is used as weight.
     * 3. If the link path has a hash, then requires the page path and search parameters to be the same as link's ones,
     *    and their hashes are treated as {@link getHashURL URLs}. The weight is calculated by applying steps 1, 2, and
     *    3 to hash URLs increased by the link path length and the number of search parameters.
     *
     * Ignores search parameters with names starting and ending with double underscores. Like `__wesib_app_rev__`.
     *
     * @param link - Navigation link to weigh.
     * @param menu - Owning navigation menu.
     * @param page - Current navigation page.
     *
     * @returns Navigation link weight. Non-positive wight means the page URL doesn't match the link at all.
     */
    weigh?(
        {
          link,
          menu,
          page,
        }: {
          link: NavLink;
          menu: NavMenu;
          page: Page;
        },
    ): number;

  }

}

class NavMenu$Links {

  private readonly _links = trackValue([new Set<NavLink>()]);
  private readonly _active = new Map<NavLink, Supply>();
  private readonly _weigh: typeof defaultNavLinkWeight;

  constructor(
      private readonly _menu: NavMenu,
      options: NavMenu.Options = {},
  ) {
    this._weigh = options.weigh ? options.weigh.bind(options) : defaultNavLinkWeight;
    this._links.supply.needs(_menu.context);

    _menu.context.whenConnected(context => {

      const navigation = context.get(Navigation);

      afterAll({
        page: navigation,
        links: this._links,
      })(({
        page: [page],
        links: [[links]],
      }) => {
        this._updateActive(page, links);
      });
    });
  }

  replace(replacement: readonly (NavLink | NavLink.Provider)[]): void {

    const toAdd = new Set<NavLink>();

    for (const linkOrProvider of replacement) {
      toAdd.add(valueByRecipe(linkOrProvider, this._menu));
    }

    const [links] = this._links.it;
    const toRemove: NavLink[] = [];

    for (const link of links.keys()) {
      if (!toAdd.delete(link)) {
        toRemove.push(link);
      }
    }

    if (toAdd.size || toRemove.length) {
      for (const removed of toRemove) {
        links.delete(removed);
        this._deactivate(removed);
        removed.supply?.off();
      }
      for (const added of toAdd) {
        links.add(added);
      }

      this._links.it = [links];
    }
  }

  private _updateActive(page: Page, links: Set<NavLink>): void {

    const toDeactivate: NavLink[] = [];
    const toActivate = this._selectActive(page, links);

    for (const link of this._active.keys()) {
      if (!toActivate.delete(link)) {
        toDeactivate.push(link);
      }
    }

    for (const deactivated of toDeactivate) {
      this._active.delete(deactivated);
      this._deactivate(deactivated);
    }
    for (const activated of toActivate) {
      if (activated.activate) {
        this._active.set(
            activated,
            activated.activate({ menu: this._menu, page: page }),
        );
      }
    }
  }

  private _selectActive(page: Page, links: Set<NavLink>): Set<NavLink> {

    let maxWeight = 0;
    let active = new Set<NavLink>();

    for (const link of links.keys()) {

      const weight = this._weigh({ link, menu: this._menu, page });

      if (weight > maxWeight) {
        maxWeight = weight;
        active = new Set<NavLink>().add(link);
      } else if (weight === maxWeight) {
        active.add(link);
      }
    }

    return active;
  }

  private _deactivate(link: NavLink): void {

    const supply = this._active.get(link);

    if (supply) {
      this._active.delete(link);
      supply.off();
    }
  }

}

function defaultNavLinkWeight(
    {
      link,
      menu,
      page,
    }: {
      link: NavLink;
      menu: NavMenu;
      page: Page;
    },
): number {

  const href = link.href;
  const linkURL = new URL(href, menu.context.get(BootstrapWindow).document.baseURI);

  return calcNavLinkWeight(linkURL, page.url);
}

function calcNavLinkWeight(linkURL: URL, pageURL: URL): number {
  if (linkURL.origin !== pageURL.origin) {
    return -1;
  }

  const linkDir = navLinkPath2dir(linkURL);
  const pageDir = navLinkPath2dir(pageURL);

  if (linkURL.hash) {
    if (linkDir !== pageDir) {
      return -1;
    }
    // Require search parameters to be equal

    const searchParamWeight = navLinkSearchParamsWeight(linkURL, pageURL);

    if (searchParamWeight < 0 || navLinkSearchParamsWeight(pageURL, linkURL) < 0) {
      return -1;
    }

    return linkURL.pathname.length
        + searchParamWeight
        + calcNavLinkWeight(getHashURL(linkURL), getHashURL(pageURL));
  }

  const searchParamWeight = navLinkSearchParamsWeight(linkURL, pageURL);

  if (searchParamWeight) {
    if (searchParamWeight < 0) {
      return -1;
    }
    if (linkDir !== pageDir) {
      return -1;
    }
    return linkURL.pathname.length + searchParamWeight;
  }

  if (!pageDir.startsWith(linkDir)) {
    return -1;
  }

  return linkURL.pathname.length;
}

function navLinkPath2dir(url: URL): string {

  const path = url.pathname;

  return path.endsWith('/') ? path : path + '/';
}

function navLinkSearchParamsWeight(
    { searchParams: linkParams }: URL,
    { searchParams: pageParams }: URL,
): number {

  let weight = 0;

  linkParams.forEach((value, key) => {
    if (!isIgnoredSearchParam(key)) {
      if (weight >= 0) {
        if (pageParams.getAll(key).includes(value)) {
          weight += 1;
        } else {
          weight = -1;
        }
      }
    }
  });

  return weight;
}

function isIgnoredSearchParam(key: string): boolean {
  return key.startsWith('__') && key.endsWith('__');
}
