import { ComponentContext, EventEmitter, EventInterest, EventProducer } from '@wesib/wesib';
import { ModelClass, ModelRef as ModelRef_ } from './model';
import { ModelDef } from './model-def';

export function modelFactory<M extends object>(modelType: ModelClass<M>): ModelRef_<M> {

  let boundTo: ComponentContext | undefined;
  const binds = new EventEmitter<(this: ModelRef) => void>();
  const unbinds = new EventEmitter<(this: ModelRef) => void>();
  let connectInterest = EventInterest.none;
  let disconnectInterest = EventInterest.none;

  class ModelRef extends ModelRef_<M> {

    constructor() {
      super();
    }

    get modelType(): ModelClass<M> {
      return modelType;
    }

    get model(): M {
      throw new Error('Model is not constructed yet');
    }

    get boundTo(): ComponentContext | undefined {
      return boundTo;
    }

    get onBind(): EventProducer<(this: this) => void> {
      return binds.on;
    }

    get onUnbind(): EventProducer<(this: this) => void> {
      return unbinds.on;
    }

    bind(context: ComponentContext) {
      this.unbind();
      boundTo = context;

      const doBind = () => binds.forEach(listener => listener.call(this));

      connectInterest = boundTo.onConnect(doBind);
      disconnectInterest = boundTo.onDisconnect(() => unbinds.forEach(listener => listener.call(this)));

      if (boundTo.connected) {
        doBind();
      }

      return this;
    }

    unbind() {
      if (!boundTo) {
        return this;
      }

      connectInterest.off();
      connectInterest = EventInterest.none;
      disconnectInterest.off();
      disconnectInterest = EventInterest.none;
      if (boundTo.connected) {
        unbinds.forEach(listener => listener.call(this));
      }
      boundTo = undefined;

      return this;
    }

  }

  function newModel(): ModelRef {

    const ref = new ModelRef();
    const proto: { [ModelRef.symbol]?: ModelRef } = modelType.prototype;
    const prev = proto[ModelRef.symbol];

    try {

      const model = new modelType(ref);

      Object.defineProperty(model, ModelRef.symbol, { value: ref });
      Object.defineProperty(ref, 'model', {
        configurable: true,
        enumerable: true,
        value: model,
      });

      return ref;
    } finally {
      proto[ModelRef.symbol] = prev;
    }
  }

  const modelRef = newModel();
  const init = ModelDef.of(modelType).init;

  if (init) {
    init.call(modelRef.model, modelRef);
  }

  return modelRef;
}
