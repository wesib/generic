import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { itsEach, overArray } from 'a-iterable';
import { importNode } from '../../util';
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
            style => importNode(
                style as HTMLLinkElement,
                doc.head,
                (from, to) => to.href = new URL(from.href, doc.baseURI).href,
            ),
        );

        return response;
      },
  );
}
