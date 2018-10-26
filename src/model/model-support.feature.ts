import { WesFeature } from '@wesib/wesib';
import { ModelFactory } from './model';
import { modelFactory } from './model-factory';

@WesFeature({
  prebootstrap: { provide: ModelFactory, value: modelFactory },
})
export class ModelSupport {}
