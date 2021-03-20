import { DomEventDispatcher } from '@frontmeans/dom-events';
import { css__naming, QualifiedName } from '@frontmeans/namespace-aliaser';
import { Supply } from '@proc7ts/supply';
import { DefaultNamespaceAliaser, Wesib__NS } from '@wesib/wesib';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { NavMenu } from './nav-menu';

export interface NavLink {

  readonly href: string;

  readonly supply?: Supply;

  activate?({ menu, page }: { menu: NavMenu; page: Page }): Supply;

}

export namespace NavLink {

  export type Provider =
      (this: void, menu: NavMenu) => NavLink;

  export interface Options {

    readonly active?: QualifiedName;

  }

}

const NavLink$activeClass: QualifiedName = ['active', Wesib__NS];

export function navAnchor(
    element: Element & { readonly href: string },
    options: NavLink.Options = {},
): NavLink.Provider {

  const { active = NavLink$activeClass } = options;
  let activeClass: string;

  return menu => {

    activeClass = css__naming.name(active, menu.context.get(DefaultNamespaceAliaser));

    const navigation = menu.context.get(Navigation);
    const supply = new DomEventDispatcher(element).on('click')(event => {

      const { href } = element;
      const pageURL = navigation.page.url;
      const url = new URL(href, element.ownerDocument.baseURI);

      if (url.origin !== pageURL.origin) {
        return; // External link
      }

      event.preventDefault();
      if (pageURL.href !== url.href) {
        navigation.open(href).catch(console.error);
      }
    });

    return ({

      get href(): string {
        return element.href;
      },

      supply,

      activate() {
        element.classList.add(activeClass);

        return new Supply(() => {
          element.classList.remove(activeClass);
        });
      },

    });
  };
}
