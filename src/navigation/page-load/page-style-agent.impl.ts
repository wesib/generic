import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { itsEach, overArray } from 'a-iterable';
import { PageLoadAgent } from './page-load-agent';

/**
 * @internal
 */
export function pageStyleAgent(context: BootstrapContext): PageLoadAgent {

  const doc = context.get(BootstrapWindow).document;

  return next => next().thru_(
      response => {
        if (!response.ok) {
          return response;
        }

        const styles = response.document.querySelectorAll('link[rel=stylesheet]');

        if (!styles.length) {
          return response;
        }
        itsEach(
            overArray(doc.querySelectorAll('link[rel=stylesheet]')).reverse(),
            style => style.parentNode!.removeChild(style),
        );
        itsEach(
            overArray(styles),
            style => {

              const clone = style.cloneNode(true) as HTMLLinkElement;

              clone.href = new URL(clone.href, doc.baseURI).href;
              doc.head.appendChild(clone);
            },
        );

        return response;
      },
  );
}
