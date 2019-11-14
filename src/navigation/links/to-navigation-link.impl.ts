import { BootstrapContext } from '@wesib/wesib';
import { DomEventDispatcher } from 'fun-events';
import { elementBehaviors } from '../../util';
import { Navigation } from '../navigation';

/**
 * @internal
 */
export function toNavigationLink(context: BootstrapContext): (element: Element) => void {

  const navigation = context.get(Navigation);

  return element => {

    const behaviors = elementBehaviors(element);

    if (!behaviors) {
      return;
    }

    const href = () => {
      return element.getAttribute('href') || element.getAttribute('b-href') || element.getAttribute('data-b-href');
    };

    let action: () => void;

    const behavior = behaviors.get('navigation-link');

    switch (behavior) {
      case 'replace':
        action = () => {

          const link = href();

          if (link) {
            navigation.replace(link);
          }
        };
        break;
      case 'back':
        action = () => navigation.back();
        break;
      case 'forward':
        action = () => navigation.forward();
        break;
      case false:
        return;
      default:
        action = () => {

          const link = href();

          if (link) {
            navigation.open(link);
          }
        };
        break;
    }

    new DomEventDispatcher(element).on('click').instead(action);
  };
}
