import { InControl } from '@frontmeans/input-aspects';

export class Field<TValue> {

  constructor(readonly control: InControl<TValue>) {
  }

}
