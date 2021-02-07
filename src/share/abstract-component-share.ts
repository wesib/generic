import { ComponentContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ShareableByComponent } from './shareable-by-component';

/**
 * Abstract component share implementation.
 *
 * Allows to share {@link ShareableByComponent shareable} values.
 *
 * @typeParam T - Shareable value type.
 * @typeParam TInternals - Shareable internals type.
 */
export abstract class AbstractComponentShare<T extends ShareableByComponent<T, any, TInternals>, TInternals>
    extends ComponentShare<T> {

  bindValue(value: T, sharer: ComponentContext): T {
    return value.shareBy(sharer);
  }

}
