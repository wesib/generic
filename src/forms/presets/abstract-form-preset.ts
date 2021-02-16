import { ContextBuilder, ContextBuilder__symbol, ContextRegistry } from '@proc7ts/context-values';
import { AfterEvent } from '@proc7ts/fun-events';
import { Class, Supply, valueProvider } from '@proc7ts/primitives';
import { FeatureDef, FeatureDef__symbol } from '@wesib/wesib';
import { Field } from '../field';
import { Form } from '../form';
import { FormPreset } from '../form-preset';

const AbstractFormPreset$feature__symbol = (/*#__PURE__*/ Symbol('AbstractFormPreset.feature'));

export abstract class AbstractFormPreset implements FormPreset.Spec, ContextBuilder {

  static get [FeatureDef__symbol](): FeatureDef {
    return this[AbstractFormPreset$feature__symbol]();
  }

  /**
   * @internal
   */
  private static [AbstractFormPreset$feature__symbol](): FeatureDef {

    const preset = new (this as unknown as Class<AbstractFormPreset>)();
    const featureDef: FeatureDef = {
      setup: setup => {
        setup.provide(preset);
      },
    };

    this[AbstractFormPreset$feature__symbol] = valueProvider(featureDef);

    return featureDef;
  }

  [ContextBuilder__symbol](registry: ContextRegistry): Supply {
    return registry.provide({ a: FormPreset, is: this });
  }

  setupField<TValue, TSharer extends object>(
      controls: AfterEvent<[Field.Controls<TValue>]>,
      _field: Field<TValue, TSharer>,
  ): AfterEvent<[Field.Controls<TValue>]> {
    return controls;
  }

  setupForm<TModel, TElt extends HTMLElement, TSharer extends object>(
      controls: AfterEvent<[Form.Controls<TModel, TElt>]>,
      _form: Form<TModel, TElt, TSharer>,
  ): AfterEvent<[Form.Controls<TModel, TElt>]> {
    return controls;
  }

}
