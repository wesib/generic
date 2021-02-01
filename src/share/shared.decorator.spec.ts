import { SingleContextKey } from '@proc7ts/context-values';
import { EventKeeper, trackValue } from '@proc7ts/fun-events';
import { Component, ComponentClass, ComponentSlot } from '@wesib/wesib';
import { testElement } from '../spec/test-element';
import { ComponentShare } from './component-share';
import { Shared } from './shared.decorator';

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
    it('shares updatable component property value', async () => {

      const value = trackValue('test1');

      @Component({ extend: { type: Object } })
      class TestComponent {

        @Shared(share)
        get sharedValue(): EventKeeper<[string]> {
          return value;
        }

      }

      const element = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const shared = context.get(share);

      expect(await shared).toBe('test1');

      value.it = 'test2';
      expect(await shared).toBe('test2');
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
  });
});
