import { onceAfter } from '@proc7ts/fun-events';
import { Class, noop, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import {
  BootstrapWindow,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentDecorator,
  ElementRenderScheduler,
  RenderDef,
} from '@wesib/wesib';
import { importNodeContent } from '../../util';
import { Navigation } from '../navigation';
import { Page } from '../page';
import { PageLoadParam } from './page-load-param';
import { PageFragmentRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoadSupport } from './page-load-support.feature';

/**
 * Creates component decorator that includes page contents into decorated component's element.
 *
 * The page is loaded and included whenever it is {@link Navigation.onEnter entered}.
 *
 * Utilizes {@link PageLoadParam} navigation parameter.
 *
 * Enables {@link PageLoadSupport} feature.
 *
 * @typeParam T - A type of decorated component class.
 * @param def - Page inclusion definition.
 *
 * @returns New component decorator.
 */
export function IncludePage<T extends ComponentClass = Class>(
    def: IncludePageDef<InstanceType<T>> = {},
): ComponentDecorator<T> {

  const onResponse = def.onResponse ? def.onResponse.bind(def) : noop;
  const contentKey: (page: Page) => string | undefined = def.contentKey
      ? def.contentKey.bind(def)
      : defaultPageContentKey;

  return Component({
    feature: {
      needs: [PageLoadSupport],
    },
    define(context) {
      context.whenComponent(context => {

        const { fragment, render } = def;
        const document = context.get(BootstrapWindow).document;
        const schedule = context.get(ElementRenderScheduler)(render);
        const navigation = context.get(Navigation);
        let lastPageURL = contentKey(navigation.page);
        let detectFragment: () => PageFragmentRequest;

        if (fragment) {
          detectFragment = valueProvider(fragment);
        } else {
          detectFragment = () => {

            const { element: { id, tagName: tag } } = context as { element: Element };

            return id ? { id } : { tag };
          };
        }

        context.whenConnected(() => {

          const range = document.createRange();

          range.selectNodeContents(context.contentRoot);

          navigation.read.do(onceAfter)(page => {
            page.put(
                PageLoadParam,
                {
                  fragment: detectFragment(),
                  receiver: {
                    supply: new Supply().needs(context),
                    receive: (_ctx, response) => handleResponse(response),
                  },
                },
            );
          });

          function handleResponse(response: PageLoadResponse): void {

            const newPageURL = contentKey(response.page);

            if (newPageURL === lastPageURL) {
              return; // Only hash changed. Do not refresh the page.
            }

            if (!response.ok) {
              schedule(() => onResponse({ context, range, response }));
              return;
            }

            lastPageURL = newPageURL;
            schedule(() => {
              range.deleteContents();

              const target = document.createDocumentFragment();
              const { fragment } = response;

              if (fragment) {
                importNodeContent(fragment, target);
                range.insertNode(target);
              }

              onResponse({ context, range, response });
            });
          }
        });
      });
    },
  });
}

/**
 * @internal
 */
function defaultPageContentKey({ url }: Page): string {
  return new URL('', url).href;
}

/**
 * Page inclusion definition.
 *
 * Configures {@link IncludePage @LoadPage} decorator.
 *
 * @typeParam T - A type of component.
 */
export interface IncludePageDef<T extends object = any> {

  /**
   * Page fragment to include.
   *
   * By default uses custom element identifier if present, or element tag name otherwise.
   */
  readonly fragment?: PageFragmentRequest;

  /**
   * Rendering options.
   */
  readonly render?: RenderDef.Options;

  /**
   * Builds content key for the given page.
   *
   * The loaded content will replace already included one only when their content key differ.
   *
   * By default uses page URL without hash part as a key. This prevents content refresh when only URL hash changes.
   *
   * @param page - Target page. Either loaded or not.
   *
   * @returns Content key.
   */
  contentKey?(page: Page): any;

  /**
   * Performs additional actions during page load.
   *
   * This method is called inside page contents render schedule for {@link PageLoadResponse each stage} of page
   * load. At the final stage it is called after loaded page contents included.
   *
   * This method can be used e.g. to indicate the page load progress.
   *
   * @param context - Decorated component context.
   * @param response - Page load response.
   * @param range - Document range the loaded page contents going to replace.
   */
  onResponse?(
      {
        context,
        response,
        range,
      }: {
        context: ComponentContext<T>;
        response: PageLoadResponse;
        range: Range;
      },
  ): void;

}
