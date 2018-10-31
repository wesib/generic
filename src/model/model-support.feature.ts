import { Feature, StateSupport } from '@wesib/wesib';
import { ModelFactory } from './model';
import { modelFactory } from './model-factory';

@Feature({
  require: StateSupport,
  prebootstrap: { provide: ModelFactory, value: modelFactory },
})
export class ModelSupport {}
