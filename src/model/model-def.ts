import { mergeFunctions, MetaAccessor } from '@wesib/wesib';
import { ModelClass, ModelRef } from './model';

export interface ModelDef<M extends object = object> {
  init?: (this: M, ref: ModelRef<M>) => void;
}

export namespace ModelDef {

  export const symbol = Symbol('model-def');

  class ModelMeta extends MetaAccessor<ModelDef<any>> {

    constructor() {
      super(symbol);
    }

    merge(...defs: ModelDef<any>[]): ModelDef<any> {

      const initial: ModelDef = {};

      return defs.reduce(
          (prev, def) => {

            const result: ModelDef = { ...prev, ...def };
            const init = mergeFunctions(prev.init, def.init);

            if (init) {
              result.init = init;
            }

            return result;
          },
          initial);
    }

  }

  const meta = new ModelMeta();

  export function of<M extends object = object>(modelType: ModelClass<M>): ModelDef<M> {
    return meta.of(modelType) || {};
  }

  export function merge<M extends object = object>(...defs: ModelDef<M>[]): ModelDef<M> {
    return meta.merge(...defs);
  }

  export function define<T extends ModelClass>(modelType: T, ...defs: ModelDef<InstanceType<T>>[]): T {
    return meta.define(modelType, ...defs);
  }

}
