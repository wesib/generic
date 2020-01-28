/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import {
  BootstrapWindow,
  Class,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentDecorator,
  DefaultRenderScheduler,
} from '@wesib/wesib';
import { noop } from 'call-thru';
import { importNodeContent } from '../../util';
import { Navigation } from '../navigation';
import { pageLoadParam } from './page-load-param';
import { PageFragmentRequest } from './page-load-request';
import { PageLoadResponse } from './page-load-response';
import { PageLoadSupport } from './page-load-support.feature';

/**
 * Creates component decorator that includes page contents into decorated component's element.
 *
 * The page is loaded and included whenever it is {@link Navigation.onEnter entered}.
 *
 * Utilizes [[pageLoadParam]] navigation parameter.
 *
 * Enables [[NavigationSupport]] and [[PageLoadSupport]] features.
 *
 * @typeparam T  A type of decorated component class.
 * @param def  Page inclusion definition.
 *
 * @returns New component decorator.
 */
export function IncludePage<T extends ComponentClass = Class>(
    def: IncludePageDef<InstanceType<T>> = {},
): ComponentDecorator<T> {

  const onResponse = def.onResponse ? def.onResponse.bind(def) : noop;

  return Component({
    feature: {
      needs: PageLoadSupport,
    },
    define(context) {
      context.whenComponent(context => {

        const document = context.get(BootstrapWindow).document;
        const schedule = context.get(DefaultRenderScheduler)();
        const navigation = context.get(Navigation);
        const detectFragment = (): PageFragmentRequest => {

          const { fragment } = def;

          if (fragment) {
            return fragment;
          }

          const { element: { id, tagName: tag } }: { element: Element } = context;

          return id ? { id } : { tag };
        };

        context.whenOn(supply => {

          const range = document.createRange();

          range.selectNodeContents(context.contentRoot as any);

          navigation.read.once(page => {
            page.put(
                pageLoadParam,
                {
                  fragment: detectFragment(),
                  receiver: {
                    supply,
                    receive: (_ctx, response) => handleResponse(response),
                  },
                },
            );
          });

          function handleResponse(response: PageLoadResponse): void {
            if (response.ok) {
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
            } else {
              schedule(() => onResponse({ context, range, response }));
            }
          }
        });
      });
    },
  });
}

/**
 * Page inclusion definition.
 *
 * Configures {@link IncludePage @LoadPage} decorator.
 *
 * @typeparam T  A type of component.
 */
export interface IncludePageDef<T extends object = any> {

  /**
   * Page fragment to include.
   *
   * By default uses custom element identifier if present, or element tag name otherwise.
   */
  fragment?: PageFragmentRequest;

  /**
   * Performs additional actions during page load.
   *
   * This method is called inside page contents render schedule for {@link PageLoadResponse.ok each stage} of page
   * load. At the final stage it is called after loaded page contents included.
   *
   * This method can be used e.g. to indicate the page load progress.
   *
   * @param context  Decorated component context.
   * @param response  Page load response.
   * @param range  Document range the loaded page contents going to replace.
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
