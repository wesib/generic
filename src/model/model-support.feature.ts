import { Feature, StateSupport } from '@wesib/wesib';
import { ModelFactory } from './model';
import { modelFactory } from './model-factory';

@Feature({
  need: StateSupport,
  set: { a: ModelFactory, is: modelFactory },
})
export class ModelSupport {}
