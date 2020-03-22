import { filterIt, itsEach, mapIt, overArray } from '@proc7ts/a-iterable';
import { BootstrapContext, BootstrapWindow } from '@wesib/wesib';
import { importNode } from '../../util';
import { PageLoadAgent } from './page-load-agent';

/**
 * @internal
 */
export function pageScriptsAgent(context: BootstrapContext): PageLoadAgent {

  const doc = context.get(BootstrapWindow).document;

  return next => next().thru_(
      response => {
        if (response.ok) {

          const allScripts = new Set<string>(mapIt(
              externalScripts(doc, overArray(doc.scripts)),
              ([src]) => src,
          ));

          itsEach(
              filterIt(
                  externalScripts(response.document, overArray(response.document.querySelectorAll('script'))),
                  ([src]) => !allScripts.has(src),
              ),
              ([src, script]) => {
                importNode(script, doc.head, (_from, to) => to.src = src);
                allScripts.add(src);
              },
          );
        }
        return response;
      },
  );
}

function externalScripts(
    doc: Document,
    scripts: Iterable<HTMLScriptElement>,
): Iterable<readonly [string, HTMLScriptElement]> {
  return mapIt(
      filterIt(
          scripts,
          script => !!script.src,
      ),
      script => [new URL(script.src, doc.baseURI).href, script] as const,
  );
}
