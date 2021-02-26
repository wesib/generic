import { SingleContextKey } from '@proc7ts/context-values';
import { AfterEvent, afterThe, trackValue } from '@proc7ts/fun-events';
import {
  BootstrapContext,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentSlot,
  DefinitionContext,
} from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '../spec/test-element';
import { ComponentShare } from './component-share';
import { ComponentShareable } from './component-shareable';
import { Shared } from './shared.decorator';
import { TargetComponentShare } from './target-component-share';

describe('share', () => {
  describe('@Shared', () => {

    let share: ComponentShare<string>;

    beforeEach(() => {
      share = new ComponentShare('test-share');
    });

    it('shares static component property value', async () => {

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share)
        sharedValue = 'test';

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;

      expect(await context.get(share)).toBe('test');
    });
    it('handles component property value updates', async () => {

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share)
        sharedValue = 'test';

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of<TestComponent>(element).whenReady;

      expect(await context.get(share)).toBe('test');
      expect(context.component.sharedValue).toBe('test');

      context.component.sharedValue = 'other';
      expect(await context.get(share)).toBe('other');
      expect(context.component.sharedValue).toBe('other');
    });
    it('shares updatable component property value', async () => {

      const value = trackValue('test1');

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share)
        get sharedValue(): AfterEvent<[string]> {
          return value.read;
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of<TestComponent>(element).whenReady;
      const shared = context.get(share);

      expect(await shared).toBe('test1');
      expect(await context.component.sharedValue).toBe('test1');

      value.it = 'test2';
      expect(await shared).toBe('test2');
      expect(await context.component.sharedValue).toBe('test2');
    });
    it('handles updatable component property value change', async () => {

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share)
        sharedValue = afterThe('test1');

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of<TestComponent>(element).whenReady;
      const shared = context.get(share);

      expect(await shared).toBe('test1');
      expect(await context.component.sharedValue).toBe('test1');

      context.component.sharedValue = afterThe('test2');
      expect(await shared).toBe('test2');
      expect(await context.component.sharedValue).toBe('test2');
    });
    it('shares shareable component property value', async () => {

      const share2 = new ComponentShare<TestShareable>('shareable-share');

      class TestShareable extends ComponentShareable<string> {

        get it(): string {
          return this.internals;
        }

      }

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share2)
        shareable = new TestShareable(() => 'test');

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const shared = context.get(share2);
      const shareable = await shared;

      expect(shareable).toBeInstanceOf(TestShareable);
      expect(shareable?.it).toBe('test');
    });
    it('applies share extension', async () => {

      const extKey1 = new SingleContextKey<ComponentShare<string>>('ext-key1');
      const extKey2 = new SingleContextKey<ComponentClass>('ext-key2');

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(
            share,
            ({ share, type }) => ({
              componentDef: {
                setup(setup) {
                  setup.perComponent({ a: extKey1, is: share });
                  setup.perComponent({ a: extKey2, is: type });
                },
              },
            }),
        )
        get sharedValue(): string {
          return 'test';
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const shared = context.get(share);

      expect(await shared).toBe('test');
      expect(context.get(extKey1)).toBe(share);
      expect(context.get(extKey2)).toBe(TestComponent);
    });

    describe('scoping', () => {

      let share2: ComponentShare<string>;

      beforeEach(() => {
        share2 = new ComponentShare('outer-share');
      });

      it('makes shared value available to nested component by default', async () => {

        const consumer = await bootstrap();

        expect(await share.valueFor(consumer)).toBe('outer');
        expect(await share2.valueFor(consumer)).toBe('outer2');
      });
      it('makes shared value available locally', async () => {

        const consumer = await bootstrap();

        expect(await share.valueFor(consumer, { local: 'too' })).toBe('inner');
        expect(await share.valueFor(consumer, { local: true })).toBe('inner');
      });
      it('allows to share only locally', async () => {

        const consumer = await bootstrap(share, { share, local: true }, { share: share2, local: true });

        expect(await share.valueFor(consumer)).toBeUndefined();
        expect(await share.valueFor(consumer, { local: true })).toBe('inner');
        expect(await share2.valueFor(consumer)).toBeUndefined();
        expect(await share2.valueFor(consumer, { local: true })).toBeUndefined();
        expect(await share2.valueFor(consumer, { local: 'too' })).toBeUndefined();
      });
      it('allows to register sharer more than once', async () => {

        const consumer = await bootstrap();
        const supply = share.addSharer(consumer.get(DefinitionContext));

        expect(await share.valueFor(consumer, { local: true })).toBe('inner');

        supply.off();
        expect(await share.valueFor(consumer, { local: true })).toBe('inner');
      });

      async function bootstrap(
          innerShare: TargetComponentShare<string> = share,
          outerShare: TargetComponentShare<string> = share,
          outerShare2: TargetComponentShare<string> = share2,
      ): Promise<ComponentContext> {

        @Component(
            'outer-element',
            { extend: { type: MockElement } },
        )
        class OuterComponent {

          @Shared(outerShare)
          shared = 'outer';

          @Shared(outerShare2)
          shared2 = 'outer2';

        }

        @Component(
            'inner-element',
            { extend: { type: MockElement } },
            { feature: { needs: OuterComponent } },
        )
        class InnerComponent {

          @Shared(innerShare)
          shared = 'inner';

        }

        const outerElt = document.createElement('outer-element');
        const innerElt = outerElt.appendChild(document.createElement('inner-element'));

        const innerDef = await testDefinition(InnerComponent);
        const outerDef = await innerDef.get(BootstrapContext).whenDefined(OuterComponent);

        outerDef.connectTo(outerElt);

        return innerDef.connectTo(innerElt).context;
      }

    });
  });
});
