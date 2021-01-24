import { EventKeeper, trackValue } from '@proc7ts/fun-events';
import { Component, ComponentSlot } from '@wesib/wesib';
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
  });
});
