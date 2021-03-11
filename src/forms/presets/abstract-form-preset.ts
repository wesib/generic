import { ContextBuilder, ContextBuilder__symbol, ContextRegistry } from '@proc7ts/context-values';
import { Class } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { Field } from '../field';
import { Form } from '../form';
import { FormPreset } from '../form-preset';

const AbstractFormPreset$map = (/*#__PURE__*/ new WeakMap<typeof AbstractFormPreset, FeatureDef>());

/**
 * Abstract form preset implementation.
 *
 * A class extending it may be used as a feature. E.g. passed to `bootstrapComponents()` function or used as a
 * dependency of another feature.
 *
 * An instance of implementation class may be created to customize its behavior. Such instance implements a
 * `ContextBuilder` interface. Thus is can be passed to context value registration method.
 */
export abstract class AbstractFormPreset implements FormPreset.Spec, ContextBuilder {

  /**
   * Feature definition of the preset.
   */
  static get [FeatureDef__symbol](): FeatureDef {

    const found = AbstractFormPreset$map.get(this);

    if (found) {
      return found;
    }

    const preset = new (this as unknown as Class<AbstractFormPreset>)();
    const featureDef: FeatureDef = {
      setup: setup => {
        setup.provide(preset);
      },
    };

    AbstractFormPreset$map.set(this, featureDef);

    return featureDef;
  }

  /**
   * Provides this form preset to the given context.
   *
   * @param registry - A context registry to provide a value to.
   *
   * @returns A supply instance that removes the added preset once cut off.
   */
  [ContextBuilder__symbol](registry: ContextRegistry): Supply {
    return registry.provide({ a: FormPreset, is: this });
  }

  /**
   * Sets up form field controls.
   *
   * Does nothing by default.
   *
   * @param _builder - Target field builder.
   */
  setupField<TValue, TSharer extends object>(
      _builder: Field.Builder<TValue, TSharer>,
  ): void {
    // No field setup
  }

  /**
   * Sets up form controls.
   *
   * Does nothing by default.
   *
   * @param _builder - Target form builder.
   */
  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      _builder: Form.Builder<TModel, TElt, TSharer>,
  ): void {
    // No form setup
  }

}
