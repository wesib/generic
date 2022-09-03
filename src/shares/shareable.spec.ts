import { describe, expect, it } from '@jest/globals';
import { afterSupplied } from '@proc7ts/fun-events';
import { Component, ComponentElement, ComponentSlot } from '@wesib/wesib';
import { MockElement, testElement } from '@wesib/wesib/testing';
import { Share } from './share';
import { Shareable } from './shareable';
import { Shared } from './shared.amendment';

describe('shares', () => {
  describe('Shareable', () => {
    const share = new Share<TestShareable>('shareable-share');

    class TestShareable extends Shareable<string> {}

    it('is bound to sharer when shared', async () => {
      @Component({ extend: { type: MockElement } })
      class TestComponent {

        @Shared(share)
        shareable = new TestShareable(() => 'test');

}

      const element: ComponentElement = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const shared = context.get(share);
      const shareable = (await shared)!;

      expect(shareable).toBeInstanceOf(TestShareable);
      expect(shareable.body).toBe('test');
      expect(shareable.sharer).toBe(context);
      expect(await afterSupplied(shareable)).toBe('test');
    });

    describe('body', () => {
      it('is not available until shared', () => {
        const shareable = new TestShareable('test');

        expect(() => shareable.body).toThrow(
          new TypeError('[object Object] is not properly shared yet'),
        );
      });
    });
    describe('sharer', () => {
      it('is not available until shared', () => {
        const shareable = new TestShareable('test');

        expect(() => shareable.sharer).toThrow(
          new TypeError('[object Object] is not properly shared yet'),
        );
      });
    });
  });
});
