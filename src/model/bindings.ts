import { ComponentContext, decoratePropertyAccessor, PropertyAccessorDescriptor } from '@wesib/wesib';
import { EventInterest, StatePath, StateTracker } from 'fun-events';
import { ModelClass, ModelRef } from './model';
import { ModelDef } from './model-def';

export function decorateBoundModelProperty<M extends ModelClass, V>(
    {
      target,
      key,
      path,
      desc,
      get,
      set,
      init = set
    }: {
      target: InstanceType<M>;
      key: string | symbol;
      path: StatePath;
      desc?: TypedPropertyDescriptor<V>;
      get: (ctx: ComponentContext) => any;
      set: (ctx: ComponentContext, newValue: any) => void;
      init?: (ctx: ComponentContext, initial: any) => void;
    }): PropertyAccessorDescriptor<V> | undefined {

  type Model = InstanceType<M>;

  const modelKey = Symbol(`${key.toString()}@model`);

  interface ModelValue {
    val: string;
  }

  function resetModelValue(model: Model) {
    delete (model as any)[modelKey];
  }

  function applyModelValue(model: Model, boundTo: ComponentContext) {

    const value: ModelValue | undefined = (model as any)[modelKey];

    if (value) { // Model value is set.
      resetModelValue(model);
      init(boundTo, value.val);
    }
  }

  ModelDef.define(
      target,
      {
        init(this: Model, ref: ModelRef<InstanceType<M>>) {

          const model = this;
          let interest: EventInterest = EventInterest.none;

          function updateModelProperty<VV>(_path: StatePath, newValue: VV) {
            (model as any)[key] = newValue;
          }

          function bind(to: ComponentContext) {
            applyModelValue(model, to);
            if (interest === EventInterest.none) { // Unless already listening for updates.
              interest = to.get(StateTracker).track(path).onUpdate(updateModelProperty);
            }
          }

          function unbind() {
            interest.off();
            interest = EventInterest.none;
            resetModelValue(model);
          }

          ref.onBind(bind);
          ref.onUnbind(unbind);

          const boundTo = ref.boundTo;

          if (boundTo) {
            bind(boundTo);
          }
        },
      });

  return decoratePropertyAccessor(target, key, desc, prev => {
    return {
      ...prev,
      get(this: Model) {

        const { boundTo } = ModelRef.of(this);

        if (boundTo) {
          return get(boundTo);
        }

        const value: ModelValue | undefined = (this as any)[modelKey];

        return value && value.val;
      },
      set(this: Model, newValue: any) {

        const { boundTo } = ModelRef.of(this);

        if (boundTo) { // Set component value. Reset model one.
          resetModelValue(this);
          set(boundTo, newValue);
        } else { // Not bound to component. Set model value instead.
          (this as any)[modelKey] = { val: newValue };
        }
      },
    };
  });
}
