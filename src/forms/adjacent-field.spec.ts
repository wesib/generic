import {
  InControl,
  InCssClasses,
  inCssError,
  InElement,
  inFormElement,
  inGroup,
  InStyledElement,
  inSubmitButton,
  inValue,
} from '@frontmeans/input-aspects';
import { arrayOfElements } from '@proc7ts/primitives';
import { Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { Share__symbol } from '../shares';
import { MockElement, testElement } from '../spec/test-element';
import { AdjacentField } from './adjacent-field';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { SharedField } from './shared-field.decorator';
import { SharedForm } from './shared-form.decorator';

describe('shares', () => {
  describe('AdjacentField', () => {

    class ButtonShare extends FieldShare {

      constructor() {
        super('button');
      }

    }

    class IndicatorShare extends FieldShare {

      constructor() {
        super('indicator');
      }

    }

    it('declares button', async () => {

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
          },
      )
      class TestComponent {

        @SharedForm()
        readonly form: Form;

        @SharedField({ share: ButtonShare })
        readonly button = AdjacentField.toForm<void>(builder => ({
          control: builder.control.build(opts => inSubmitButton(
              document.createElement('button'),
              {
                ...opts,
                form: builder.adjusted.control,
              },
          )),
        }));

        constructor(context: ComponentContext) {
          this.form = Form.by(
              opts => inGroup({}, opts),
              opts => inFormElement(context.element, opts),
          );
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const button = await ButtonShare[Share__symbol].valueFor(context, { local: true });

      expect(button).toBeInstanceOf(AdjacentField);
      expect(button?.isAdjacent).toBe(true);
      expect(button?.control).toBeInstanceOf(InElement);
    });

    it('declares error indicator', async () => {

      @Component(
          'test-element',
          {
            extend: { type: MockElement },
          },
      )
      class TestComponent {

        @SharedField()
        readonly field = Field.by(opts => inValue('test', opts));

        @SharedField({ share: IndicatorShare })
        readonly button = AdjacentField.toField<unknown>(builder => ({
          control: builder.control.build(
              opts => builder.adjusted.control
                  .convert(InStyledElement.to(document.createElement('div')), ...arrayOfElements(opts.aspects))
                  .setup(InCssClasses, css => css.add(inCssError())),
          ),
        }));

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const indicator = await IndicatorShare[Share__symbol].valueFor(context, { local: true });

      expect(indicator).toBeInstanceOf(AdjacentField);
      expect(indicator?.isAdjacent).toBe(true);
      expect(indicator?.control).toBeInstanceOf(InControl);
    });
  });
});
