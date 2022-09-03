import { beforeEach, describe, expect, it } from '@jest/globals';
import { cxConstAsset } from '@proc7ts/context-builder';
import { CxEntry, cxSingle } from '@proc7ts/context-values';
import { AfterEvent } from '@proc7ts/fun-events';
import {
  BootstrapContext,
  Component,
  ComponentClass,
  ComponentContext,
  ComponentElement,
  ComponentSlot,
  DefinitionContext,
} from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '@wesib/wesib/testing';
import { Share } from './share';
import { Shared } from './shared.amendment';
import { TargetShare } from './target-share';

describe('shares', () => {
  describe('@Shared', () => {
    let doc: Document;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
    });

    let share: Share<string>;

    beforeEach(() => {
      share = new Share('test-share');
    });

    it('shares static component property value', async () => {
      @Component({ extend: { type: MockElement } })
      class TestComponent {

        @Shared(share)
        sharedValue = 'test';

}

      const element: ComponentElement = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;

      expect(await context.get(share)).toBe('test');
    });
    it('handles component property value updates', async () => {
      let getShared!: (instance: TestComponent) => AfterEvent<[string?]>;

      @Component({ extend: { type: MockElement } })
      class TestComponent {

        @Shared(share, ({ amend }) => {
          getShared = amend()().getShared;
        })
        sharedValue = 'test';

}

      const element: ComponentElement<TestComponent> = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;

      expect(await context.get(share)).toBe('test');
      expect(await getShared(context.component)).toBe('test');
      expect(context.component.sharedValue).toBe('test');

      context.component.sharedValue = 'other';
      expect(await context.get(share)).toBe('other');
      expect(await getShared(context.component)).toBe('other');
      expect(context.component.sharedValue).toBe('other');
    });
    it('applies share extension', async () => {
      const extEntry1: CxEntry<Share<string>> = { perContext: cxSingle() };
      const extEntry2: CxEntry<ComponentClass> = { perContext: cxSingle() };

      @Component({ extend: { type: MockElement } })
      class TestComponent {

        @Shared(share, ({ amendedClass, share, amend }) => amend({
            componentDef: {
              setup(setup) {
                setup.perComponent(cxConstAsset(extEntry1, share));
                setup.perComponent(cxConstAsset(extEntry2, amendedClass));
              },
            },
          }))
        get sharedValue(): string {
          return 'test';
        }

}

      const element: ComponentElement<TestComponent> = new (await testElement(TestComponent))();
      const context = await ComponentSlot.of(element).whenReady;
      const shared = context.get(share);

      expect(await shared).toBe('test');
      expect(context.get(extEntry1)).toBe(share);
      expect(context.get(extEntry2)).toBe(TestComponent);
    });

    describe('scoping', () => {
      let share2: Share<string>;

      beforeEach(() => {
        share2 = new Share('outer-share');
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
        const consumer = await bootstrap(
          share,
          { share, local: true },
          { share: share2, local: true },
        );

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
        innerShare: TargetShare<string> = share,
        outerShare: TargetShare<string> = share,
        outerShare2: TargetShare<string> = share2,
      ): Promise<ComponentContext> {
        @Component('outer-element', { extend: { type: MockElement } })
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

        const outerElt = doc.body.appendChild(doc.createElement('outer-element'));
        const innerElt = outerElt.appendChild(doc.createElement('inner-element'));

        const innerDef = await testDefinition(InnerComponent);
        const outerDef = await innerDef.get(BootstrapContext).whenDefined(OuterComponent);

        outerDef.mountTo(outerElt);

        return innerDef.mountTo(innerElt);
      }
    });
  });
});
