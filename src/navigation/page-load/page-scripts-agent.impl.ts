import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { filterIt, itsEach, mapIt, overArray } from 'a-iterable';
import { PageLoadAgent } from './page-load-agent';

/**
 * @internal
 */
export function pageScriptsAgent(context: BootstrapContext): PageLoadAgent {

  const head = context.get(BootstrapWindow).document.head;
  const allScripts = new Set<string>();

  return next => next().thru_(
      response => {
        if (response.ok) {
          itsEach(
              filterIt(
                  mapIt(
                      filterIt(
                        overArray(response.document.querySelectorAll('script')),
                        script => !!script.src,
                      ),
                      script => ([new URL(script.src, response.document.baseURI).href, script] as const),
                  ),
                  ([src]) => !allScripts.has(src),
              ),
              ([src, script]) => {

                const clone = script.cloneNode() as HTMLScriptElement;

                clone.src = src;
                head.appendChild(clone);
                allScripts.add(src);
              },
          );
        }
        return response;
      },
  );
}
