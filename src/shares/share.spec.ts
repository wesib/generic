import { drekContextOf } from '@frontmeans/drek';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxAsset } from '@proc7ts/context-values';
import { AfterEvent, afterEventBy, trackValue } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import {
  BootstrapContext,
  Component,
  ComponentContext,
  ComponentElement,
  ComponentSlot,
  DefinitionContext,
} from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '@wesib/wesib/testing';
import { Share } from './share';
import { ShareRegistry } from './share-registry.impl';
import { SharedValue } from './shared-value';
import { SharedValue$ContextBuilder } from './shared-value.impl';

describe('shares', () => {
  describe('Share', () => {

    let doc: Document;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
    });

    let share: Share<string>;

    beforeEach(() => {
      share = new Share('test-share');
    });

    describe('name', () => {
      it('equals to the name of the share', () => {
        expect(share.name).toBe('test-share');
      });
    });

    describe('toString', () => {
      it('returns string representation', () => {
        expect(`${share}`).toBe('[Share test-share]');
      });
    });

    describe('addSharer', () => {

      let bsContext: BootstrapContext;
      let defContext: DefinitionContext;
      let registry: ShareRegistry;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {
        }

        defContext = await testDefinition(TestComponent);
        bsContext = defContext.get(BootstrapContext);
        registry = bsContext.get(ShareRegistry);
      });

      it('registers sharer', () => {

        const supply = share.addSharer(defContext);

        expect(sharerNames(share)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(share)).toHaveLength(0);
      });
      it('registers sharer for aliased shares', () => {

        const share2 = new Share('other-share', { as: share });
        const supply = share2.addSharer(defContext);

        expect(sharerNames(share)).toEqual(['test-component']);
        expect(sharerNames(share2)).toEqual(['test-component']);

        supply.off();
        expect(sharerNames(share)).toHaveLength(0);
        expect(sharerNames(share2)).toHaveLength(0);
      });

      function sharerNames(share: Share<unknown>): readonly string[] {
        return [...registry.sharers(share).it.names.keys()];
      }
    });

    describe('shareValue', () => {

      let share2: Share<string>;

      beforeEach(() => {
        share2 = new Share('other-share', { as: share });
      });

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: MockElement },
        })
        class TestComponent {
        }

        const element: ComponentElement = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      it('shares nothing by default', async () => {
        expect(await context.get(share)).toBeUndefined();
      });
      it('shares static value', async () => {
        defContext.perComponent(shareValue(share, () => 'test'));
        expect(await context.get(share)).toBe('test');
      });
      it('shares updatable value', async () => {

        const value = trackValue('test1');

        defContext.perComponent(shareValue(share, () => value.read));
        expect(await context.get(share)).toBe('test1');

        value.it = 'test2';
        expect(await context.get(share)).toBe('test2');
      });
      it('shares static value for aliased shares', async () => {
        defContext.perComponent(shareValue(share2, () => 'test'));
        expect(await context.get(share)).toBe('test');
        expect(await context.get(share2)).toBe('test');
      });
      it('shares updatable value for aliased shares', async () => {

        const value = trackValue('test1');

        defContext.perComponent(shareValue(share2, () => value.read));
        expect(await context.get(share)).toBe('test1');
        expect(await context.get(share2)).toBe('test1');

        value.it = 'test2';
        expect(await context.get(share)).toBe('test2');
        expect(await context.get(share2)).toBe('test2');
      });
    });

    describe('selectValue', () => {

      let share2: Share<string>;
      let share3: Share<string>;

      beforeEach(() => {
        share2 = new Share('other-share', { as: share });
        share3 = new Share('third-share', { as: [share2, share] });
      });

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: MockElement },
        })
        class TestComponent {
        }

        const element: ComponentElement = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      it('prefers explicitly shared value', async () => {

        const value1 = trackValue('test1');
        const value2 = trackValue('test2');

        defContext.perComponent(shareValue(share, () => value1.read));
        defContext.perComponent(shareValue(share2, () => value2.read));
        expect(await context.get(share)).toBe('test1');
        expect(await context.get(share2)).toBe('test2');

        value2.it = 'test2b';
        expect(await context.get(share)).toBe('test1');
        expect(await context.get(share2)).toBe('test2b');

        value1.it = 'test1b';
        expect(await context.get(share)).toBe('test1b');
        expect(await context.get(share2)).toBe('test2b');
      });
      it('prefers bare value despite the order of sharing', async () => {

        const value1 = trackValue('test1');
        const value2 = trackValue('test2');

        defContext.perComponent(shareValue(share, () => value1.read));
        defContext.perComponent(shareValue(share2, () => value2.read));
        expect(await context.get(share)).toBe('test1');
        expect(await context.get(share2)).toBe('test2');

        value2.it = 'test2b';
        expect(await context.get(share)).toBe('test1');
        expect(await context.get(share2)).toBe('test2b');

        value1.it = 'test1b';
        expect(await context.get(share)).toBe('test1b');
        expect(await context.get(share2)).toBe('test2b');
      });
      it('prefers detailed value with lower priority', async () => {

        const value1 = trackValue('test1');
        const value2 = trackValue('test2');

        defContext.perComponent(shareValue(share, () => value1.read, 1));
        defContext.perComponent(shareValue(share, () => value2.read, 2));
        expect(await context.get(share)).toBe('test1');

        value2.it = 'test2b';
        expect(await context.get(share)).toBe('test1');

        value1.it = 'test1b';
        expect(await context.get(share)).toBe('test1b');
      });
      it('prefers shared value with earlier aliasing order', async () => {

        const value2 = trackValue('test2');
        const value3 = trackValue('test3');

        defContext.perComponent(shareValue(share2, () => value2.read));
        defContext.perComponent(shareValue(share3, () => value3.read));
        expect(await context.get(share)).toBe('test2');
        expect(await context.get(share2)).toBe('test2');
        expect(await context.get(share3)).toBe('test3');

        value2.it = 'test2b';
        expect(await context.get(share)).toBe('test2b');
        expect(await context.get(share2)).toBe('test2b');
        expect(await context.get(share3)).toBe('test3');

        value3.it = 'test3b';
        expect(await context.get(share)).toBe('test2b');
        expect(await context.get(share2)).toBe('test2b');
        expect(await context.get(share3)).toBe('test3b');
      });
      it('prefers shared value with earlier aliasing order despite the order of sharing', async () => {

        const value2 = trackValue('test2');
        const value3 = trackValue('test3');

        defContext.perComponent(shareValue(share3, () => value3.read));
        defContext.perComponent(shareValue(share2, () => value2.read));
        expect(await context.get(share)).toBe('test2');
        expect(await context.get(share2)).toBe('test2');
        expect(await context.get(share3)).toBe('test3');

        value2.it = 'test2b';
        expect(await context.get(share)).toBe('test2b');
        expect(await context.get(share2)).toBe('test2b');
        expect(await context.get(share3)).toBe('test3');

        value3.it = 'test3b';
        expect(await context.get(share)).toBe('test2b');
        expect(await context.get(share2)).toBe('test2b');
        expect(await context.get(share3)).toBe('test3b');
      });
    });

    describe('valueFor', () => {

      let sharerDefContext: DefinitionContext;
      let testDefContext: DefinitionContext;

      beforeEach(async () => {

        @Component({
          extend: { type: MockElement },
          define(defContext) {
            testDefContext = defContext;
          },
        })
        class TestComponent {
        }

        @Component({
          extend: { type: MockElement },
          feature: {
            needs: TestComponent,
          },
        })
        class SharerComponent {
        }

        sharerDefContext = await testDefinition(SharerComponent);
      });

      let sharerEl: ComponentElement;
      let sharerContext: ComponentContext;
      let testEl: ComponentElement;
      let testCtx: ComponentContext;

      beforeEach(() => {
        sharerEl = doc.createElement('sharer-el');
        sharerContext = sharerDefContext.mountTo(sharerEl);

        testEl = sharerEl.appendChild(doc.createElement('test-el'));
        testCtx = testDefContext.mountTo(testEl);
      });

      it('reports nothing without sharer registered', () => {
        sharerDefContext.perComponent(shareValue(share, () => 'test'));

        const receiver = jest.fn();

        share.valueFor(testCtx)(receiver);
        expect(receiver).toHaveBeenCalledWith(...([] as unknown[] as [unknown, unknown[]]));
      });
      it('reports nothing without value shared', () => {
        share.addSharer(sharerDefContext, { name: 'sharer-el' });

        const value = afterEventBy<[]>(noop, () => []);

        sharerDefContext.perComponent(shareValue(share, () => value));

        const receiver = jest.fn();

        share.valueFor(testCtx)(receiver);
        expect(receiver).toHaveBeenCalledWith(...([] as unknown[] as [unknown, unknown[]]));
      });
      it('does not report missing value with lower priority', () => {
        share.addSharer(sharerDefContext, { name: 'sharer-el' });

        const value = afterEventBy<[]>(noop, () => []);

        sharerDefContext.perComponent(shareValue<string>(share, () => value, 1));
        sharerDefContext.perComponent(shareValue<string>(share, () => 'test', 2));

        const receiver = jest.fn();

        share.valueFor(testCtx)(receiver);
        expect(receiver).toHaveBeenLastCalledWith('test', sharerContext);
      });
      it('reports value shared by parent sharer', () => {
        share.addSharer(sharerDefContext, { name: 'sharer-el' });
        share.addSharer(testDefContext, { name: 'test-el' });
        sharerDefContext.perComponent(shareValue(share, () => 'test'));

        const receiver = jest.fn();

        share.valueFor(testCtx)(receiver);
        expect(receiver).toHaveBeenLastCalledWith('test', sharerContext);
        expect(receiver).toHaveBeenCalledTimes(1);

        const sharerDrc = drekContextOf(sharerEl);

        doc.body.appendChild(sharerEl);
        sharerDrc.lift();

        expect(receiver).toHaveBeenLastCalledWith('test', sharerContext);
        expect(receiver).toHaveBeenCalledTimes(1);
      });
      it('reports value shared by component itself when `local` set to `true`', () => {
        share.addSharer(sharerDefContext, { name: 'sharer-el' });
        share.addSharer(testDefContext, { name: 'test-el' });
        sharerDefContext.perComponent(shareValue(share, () => 'test1'));
        testDefContext.perComponent(shareValue(share, () => 'test2'));

        const receiver = jest.fn();

        share.valueFor(testCtx, { local: true })(receiver);
        expect(receiver).toHaveBeenLastCalledWith('test2', testCtx);
        expect(receiver).toHaveBeenCalledTimes(1);
      });
      it('reports value shared by mounted parent sharer', () => {
        sharerEl = doc.createElement('sharer-el');

        testEl = sharerEl.appendChild(doc.createElement('test-el'));
        testCtx = testDefContext.mountTo(testEl);

        share.addSharer(sharerDefContext, { name: 'sharer-el' });
        sharerDefContext.perComponent(shareValue(share, () => 'test'));

        const receiver = jest.fn();

        share.valueFor(testCtx)(receiver);
        expect(receiver).toHaveBeenLastCalledWith(...([] as unknown[] as [unknown, unknown[]]));

        sharerContext = sharerDefContext.mountTo(sharerEl);

        const sharerDrc = drekContextOf(sharerEl);

        sharerEl.appendChild(doc.body);
        sharerDrc.lift();

        expect(receiver).toHaveBeenLastCalledWith('test', sharerContext);
        expect(receiver).toHaveBeenCalledTimes(2);
      });
    });
  });

  function shareValue<T, TSharer extends object = any>(
      share: Share<T>,
      provide: <TCtx extends TSharer>(target: Share.Target<T, TCtx>) => T | AfterEvent<[T?]>,
      priority?: number,
  ): CxAsset<AfterEvent<[T?]>, SharedValue<T>, ComponentContext<TSharer>> {
    return SharedValue$ContextBuilder<T, TSharer>(
        share,
        {
          priority,
          provide,
        },
    );
  }

});
