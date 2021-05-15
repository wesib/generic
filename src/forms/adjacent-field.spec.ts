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
import { AfterEvent, mapAfter, trackValue } from '@proc7ts/fun-events';
import { arrayOfElements } from '@proc7ts/primitives';
import { Component, ComponentContext, ComponentSlot } from '@wesib/wesib';
import { MockElement, testElement } from '@wesib/wesib/testing';
import { Share__symbol } from '../shares';
import { adjacentToField, adjacentToForm } from './adjacent-field';
import { Field } from './field';
import { FieldShare } from './field.share';
import { Form } from './form';
import { SharedField } from './shared-field.amendment';
import { SharedForm } from './shared-form.amendment';

describe('shares', () => {

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
      readonly button = adjacentToForm<void>(builder => ({
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

    expect(button).toBeInstanceOf(Field);
    expect(button?.control).toBeInstanceOf(InElement);
  });

  it('declares error indicator', async () => {

    const hasField = trackValue(false);
    const hasControls = trackValue(false);

    @Component(
        'test-element',
        {
          extend: { type: MockElement },
        },
    )
    class TestComponent {

      @SharedField()
      readonly field: AfterEvent<[Field<string>?]> = hasField.read.do(
          mapAfter((hasField: boolean): Field<string> | undefined => hasField
              ? new Field<string>(builder => hasControls.read.do(
                  mapAfter(hasControls => hasControls
                      ? { control: builder.control.build(opts => inValue('test', opts)) }
                      : undefined),
              ))
              : undefined),
      );

      @SharedField({ share: IndicatorShare })
      readonly button = adjacentToField<unknown>(builder => ({
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

    expect(indicator).toBeInstanceOf(Field);
    expect(indicator?.control).toBeUndefined();

    hasField.it = true;
    expect(indicator?.control).toBeUndefined();

    hasControls.it = true;
    expect(indicator?.control).toBeInstanceOf(InControl);
  });
});
