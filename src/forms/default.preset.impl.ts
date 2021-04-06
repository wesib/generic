import {
  InAspect,
  InBuilder,
  InControl,
  InNamespaceAliaser,
  InRenderScheduler,
  knownInAspect,
} from '@frontmeans/input-aspects';
import { ComponentContext, ComponentRenderScheduler, DefaultNamespaceAliaser } from '@wesib/wesib';
import { Field } from './field';
import { Form } from './form';
import { FormPreset } from './form-preset';

/**
 * @internal
 */
export const DefaultFormPreset: FormPreset.Spec = {

  setupField<TValue, TSharer extends object>(
      { sharer, control }: Field.Builder<TValue, TSharer>,
  ): void {
    DefaultFormPreset$setup(sharer, control);
  },

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      { sharer, control, element }: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    DefaultFormPreset$setup(sharer, control);
    DefaultFormPreset$setup(sharer, element);
  },

};

function DefaultFormPreset$setup<TValue, TSharer extends object>(
    sharer: ComponentContext<TSharer>,
    builder: InBuilder<InControl<TValue>>,
): void {

  const nsAliaser = sharer.get(DefaultNamespaceAliaser);
  const renderScheduler = sharer.get(ComponentRenderScheduler);

  builder
      .addAspect(
          InNamespaceAliaser,
          {
            applyAspect<TInstance, TKind extends InAspect.Application.Kind>(
                _aspect: InAspect<TInstance, TKind>,
            ): InAspect.Application.Result<TInstance, TValue, TKind> {
              return knownInAspect(nsAliaser) as InAspect.Application.Result<TInstance, TValue, TKind>;
            },
          },
      ).addAspect(
      InRenderScheduler,
      {
        applyAspect<TInstance, TKind extends InAspect.Application.Kind>(
            _aspect: InAspect<TInstance, TKind>,
        ): InAspect.Application.Result<TInstance, TValue, TKind> {
          return knownInAspect(renderScheduler) as InAspect.Application.Result<TInstance, TValue, TKind>;
        },
      },
  );
}
