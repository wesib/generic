/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { mapIt } from '@proc7ts/a-iterable';
import { nextArgs, noop } from '@proc7ts/call-thru';
import {
  afterEach,
  AfterEvent,
  afterEventBy,
  afterSupplied,
  afterThe,
  EventKeeper,
  eventSupply,
  EventSupply,
  nextAfterEvent,
} from '@proc7ts/fun-events';
import { css__naming, QualifiedName } from '@proc7ts/namespace-aliaser';
import {
  Class,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentDecorator,
  DefaultNamespaceAliaser,
  ElementRenderScheduler,
  RenderDef,
  Wesib__NS,
} from '@wesib/wesib';
import { ComponentNode, ElementNode, ElementPickMode } from '../tree';
import { getHashURL } from './hash-url';
import { Navigation } from './navigation';
import { NavigationSupport } from './navigation-support.feature';
import { Page } from './page';

/**
 * @internal
 */
interface ActiveNavLink {
  supply(): EventSupply;
}

/**
 * @internal
 */
type ActiveNavLinks = Map<ElementNode, ActiveNavLink>;

/**
 * Creates component decorator that marks navigation link(s) inside decorated component active.
 *
 * Marks navigation links with highest weight.
 *
 * Enables [[NavigationSupport]] feature.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Navigation link activation definition.
 *
 * @returns New component decorator.
 */
export function ActivateNavLink<T extends ComponentClass = Class>(
    def: ActivateNavLinkDef<InstanceType<T>> = {},
): ComponentDecorator<T> {

  const { select = 'a', pick = { all: true, deep: true } } = def;

  return Component({
    feature: {
      needs: NavigationSupport,
    },
    define(defContext) {
      defContext.whenComponent(context => {

        const activate = activateNavLink(context, def);
        const weigh = navLinkWeight(def);
        const navigation = context.get(Navigation);
        const componentNode = context.get(ComponentNode);

        context.whenConnected(() => {

          let active: ActiveNavLinks = new Map();

          navigation.read().tillOff(context).consume(
              page => componentNode.select(select, pick).read().keepThru_(
                  nodes => nextAfterEvent(afterEach(
                      ...mapIt(nodes, node => weigh({ node, context, page })),
                  )),
              ).consume(
                  (...weights: NavLinkWeight[]) => {

                    const selected = selectActiveNavLinks(weights);
                    const newActive: ActiveNavLinks = new Map();
                    const result = eventSupply();

                    selected.forEach(node => {

                      let activeLink: ActiveNavLink;
                      const existing = active.get(node);

                      if (existing) {
                        newActive.set(node, existing);
                        activeLink = existing;
                      } else {
                        activeLink = activate({ node, context, page });
                        newActive.set(node, activeLink);
                      }

                      activeLink.supply().needs(result);
                    });

                    active = newActive;

                    return result;
                  },
              ),
          );
        });
      });
    },
  });
}

/**
 * Navigation link activation definition.
 *
 * Defines a set of element nodes considered to be navigation links. Each matching node is {@link weigh weighed}
 * against {@link Navigation.read current page}, and the link with highest weight is marked [[active]].
 *
 * @typeparam T  A type of component.
 */
export interface ActivateNavLinkDef<T extends object = any> {

  /**
   * Navigation links CSS selector.
   *
   * `a` by default.
   */
  readonly select?: string;

  /**
   * A mode of navigation link node picking from component tree.
   *
   * By default picks any matching element from entire subtree.
   */
  readonly pick?: ElementPickMode;

  /**
   * Qualified name of CSS class to mark the active element with.
   *
   * The `active` class in Wesib namespace is used by default.
   */
  readonly active?: QualifiedName;

  /**
   * Rendering definition options to pass to nav links render scheduler.
   */
  readonly render?: RenderDef.Options;

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
   *    and their hashes are treated as {@link getHashURL URLs}. The weight is calculated by applying steps 1, 2, and 3
   *    to hash URLs increased by the link path length and the number of search parameters.
   *
   * Ignores search parameters with names starting and ending with double underscores. Like `__wesib_app_rev__`.
   *
   * @param node  Navigation link node to weigh.
   * @param page  Current navigation page.
   * @param context  Decorated component context.
   *
   * @returns Either navigation link weight, or its keeper. Non-positive wights means the page URL doesn't match
   * the link at all.
   */
  weigh?(
      {
        node,
        page,
        context,
      }: {
        node: ElementNode;
        page: Page;
        context: ComponentContext<T>;
      },
  ): number | EventKeeper<[number]>;

  /**
   * Changes navigation link activity state.
   *
   * This method is called each time the active link changed.
   *
   * @param active  Whether to make target link active (`true`), or inactive (`false`).
   * @param node  Navigation link node to update activity state of.
   * @param page  Current navigation page.
   * @param context  Decorated component context.
   */
  activate?(
      active: boolean,
      {
        node,
        page,
        context,
      }: {
        node: ElementNode;
        page: Page;
        context: ComponentContext<T>;
      },
  ): void;

}

/**
 * @internal
 */
type NavLinkWeight = [ElementNode, number];

/**
 * @internal
 */
interface NavLinkOpts {
  node: ElementNode;
  page: Page;
  context: ComponentContext;
}

/**
 * @internal
 */
function selectActiveNavLinks(weights: NavLinkWeight[]): ElementNode[] {

  let maxWeight = 0;
  let active: ElementNode[] = [];

  weights.forEach(([node, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      active = [node];
    } else if (weight === maxWeight) {
      active.push(node);
    }
  });

  return active;
}

/**
 * @internal
 */
function navLinkWeight(
    def: ActivateNavLinkDef,
): (opts: NavLinkOpts) => AfterEvent<NavLinkWeight> {
  if (!def.weigh) {
    return defaultNavLinkWeight;
  }
  return opts => {

    const weight = def.weigh!(opts);

    if (typeof weight === 'number') {
      return afterThe(opts.node, weight);
    }

    let supplier: AfterEvent<NavLinkWeight> = afterSupplied(weight).keepThru_(
        weight => nextArgs(opts.node, weight),
    );

    return afterEventBy<NavLinkWeight>(receiver => {
      supplier.to({
        supply: eventSupply()
            .needs(receiver.supply)
            .whenOff(() => {
              // Fall back to zero weight once the weight supply cut off
              supplier = afterThe(opts.node, 0);
              supplier.to(receiver);
            }),
        receive: receiver.receive.bind(receiver),
      });
    });
  };
}

/**
 * @internal
 */
function defaultNavLinkWeight(
    {
      node,
      page,
    }: NavLinkOpts,
): AfterEvent<NavLinkWeight> {

  const element: Element = node.element;
  const href = element.getAttribute('href');

  if (href == null) {
    return afterThe(node, -1);
  }

  const linkURL = new URL(href, element.ownerDocument!.baseURI);

  return afterThe(node, calcNavLinkWeight(linkURL, page.url));
}

/**
 * @internal
 */
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

/**
 * @internal
 */
function navLinkPath2dir(url: URL): string {

  const path = url.pathname;

  return path.endsWith('/') ? path : path + '/';
}

/**
 * @internal
 */
function navLinkSearchParamsWeight(
    { searchParams: linkParams }: URL,
    { searchParams: pageParams }: URL,
): number {

  let weight = 0;

  linkParams.forEach((_value, key) => {
    if (!isIgnoredSearchParam(key)) {

      const pageValues = new Set(pageParams.getAll(key));

      if (weight >= 0) {
        if (linkParams.getAll(key).every(linkValue => pageValues.has(linkValue))) {
          weight += 1;
        } else {
          weight = -1;
        }
      }
    }
  });

  return weight;
}

/**
 * @internal
 */
function isIgnoredSearchParam(key: string): boolean {
  return key.startsWith('__') && key.endsWith('__');
}

/**
 * @internal
 */
const NavLinkRenderSchedule__symbol = (/*#__PURE__*/ Symbol('nav-link-render-schedule'));

/**
 * @internal
 */
const defaultActiveNavLinkClass: QualifiedName = ['active', Wesib__NS];

/**
 * @internal
 */
function activateNavLink(
    context: ComponentContext,
    def: ActivateNavLinkDef,
): (opts: NavLinkOpts) => ActiveNavLink {

  const scheduler = context.get(ElementRenderScheduler);
  const { render, active = defaultActiveNavLinkClass } = def;
  const activeClass = css__naming.name(active, context.get(DefaultNamespaceAliaser));
  const activate = def.activate ? def.activate.bind(def) : noop;
  const assignClass = (active: boolean, { node }: { node: ElementNode }): void => {

    const element: Element = node.element;
    const { classList } = element;

    if (active) {
      classList.add(activeClass);
    } else {
      classList.remove(activeClass);
    }
  };

  return opts => {

    const { element } = opts.node;
    const schedule = element[NavLinkRenderSchedule__symbol]
        || (element[NavLinkRenderSchedule__symbol] = scheduler(render));
    const makeActive = (active: boolean): void => {
      schedule(() => assignClass(active, opts));
      activate(active, opts);
    };

    makeActive(true);

    let lastSupply: EventSupply | undefined;

    return {
      supply(): EventSupply {

        const supply = lastSupply = eventSupply(() => {
          if (lastSupply === supply) {
            makeActive(false);
          }
        });

        return supply;
      },
    };
  };
}
