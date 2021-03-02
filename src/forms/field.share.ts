import { DefaultShare } from '../shares';
import { Field } from './field';

/**
 * A kind of component share containing a {@link Field form field}.
 *
 * This class may be inherited to represent a specific type of forms. E.g. to distinguish multiple fields defined
 * within the same component.
 *
 * @typeParam TValue - Field value type.
 */
export class FieldShare<TValue = any> extends DefaultShare<Field<TValue>> {

  static get defaultShareName(): string {
    return 'field';
  }

}
