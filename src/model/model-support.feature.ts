import { Feature } from '@wesib/wesib';
import { ModelFactory } from './model';
import { modelFactory } from './model-factory';

@Feature({
  prebootstrap: { provide: ModelFactory, value: modelFactory },
})
export class ModelSupport {}
