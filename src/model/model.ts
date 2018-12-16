import { ComponentContext } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { EventProducer } from 'fun-events';

/**
 * Model class constructor.
 *
 * Constructor may accept a model context instance as the only parameter.
 *
 * @param <M> A type of model.
 */
export interface ModelClass<M extends object = object> extends Function {
  new (ref: ModelRef<M>): M;
  prototype: M;
}

export type ModelFactory = <M extends object>(this: void, modelType: ModelClass<M>) => ModelRef<M>;

export namespace ModelFactory {

  export const key: ContextKey<ModelFactory> = new SingleContextKey('model-factory');

}

export abstract class ModelRef<M extends object = object> {

  /**
   * A key of a model instance property containing a model reference.
   */
  static readonly symbol = Symbol('model-ref');

  abstract readonly modelType: ModelClass<M>;

  abstract readonly model: M;

  abstract readonly boundTo?: ComponentContext;

  /**
   * Registers model binding listener.
   *
   * This listener will be called when model is bound to component using `bind()` method and component element
   * is connected.
   *
   * @param listener A listener to notify on model binding.
   *
   * @return An event interest instance.
   */
  abstract readonly onBind: EventProducer<(this: this, to: ComponentContext) => void>;

  /**
   * Registers model unbinding listener.
   *
   * This listener will be called when model is unbound from component using `unbind()` method.
   * This also happens when already bound model is bound to another component.
   *
   * @param listener A listener to notify on model binding.
   *
   * @return An event interest instance.
   */
  abstract readonly onUnbind: EventProducer<(this: this) => void>;

  /**
   * Extracts model context from model instance.
   *
   * @param model Model instance.
   *
   * @return Model context reference stored under `[ModelContext.symbol]` key.
   *
   * @throws TypeError When the given `model` does not contain model context reference.
   */
  static of<M extends object>(model: M): ModelRef<M> {

    const context = (model as any)[ModelRef.symbol];

    if (!context) {
      throw TypeError(`No model context found in ${model}`);
    }

    return context;
  }

  abstract bind(to: ComponentContext): this;

  abstract unbind(): this;

}
