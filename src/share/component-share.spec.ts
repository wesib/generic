import { ContextKey__symbol } from '@proc7ts/context-values';
import { trackValue } from '@proc7ts/fun-events';
import {
  BootstrapContext,
  Component,
  ComponentContext,
  ComponentElement,
  ComponentMount,
  ComponentSlot,
  DefinitionContext,
} from '@wesib/wesib';
import { MockElement, testDefinition, testElement } from '../spec/test-element';
import { ComponentShare } from './component-share';
import { ComponentShareRegistry } from './component-share-registry.impl';

describe('share', () => {
  describe('ComponentShare', () => {

    let share: ComponentShare<string>;

    beforeEach(() => {
      share = new ComponentShare('test-share');
    });

    describe('name', () => {
      it('equals to the name of the share', () => {
        expect(share.name).toBe('test-share');
      });
    });

    describe('[ContextKey__symbol]', () => {
      it('is updatable context key', () => {

        const key = share[ContextKey__symbol];

        expect(key.upKey).toBe(key);
      });
    });

    describe('addSharer', () => {

      let bsContext: BootstrapContext;
      let defContext: DefinitionContext;
      let registry: ComponentShareRegistry;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {
        }

        defContext = await testDefinition(TestComponent);
        bsContext = defContext.get(BootstrapContext);
        registry = bsContext.get(ComponentShareRegistry);
      });

      it('registers sharer', async () => {

        const supply = share.addSharer(defContext);

        expect([...await registry.sharers(share)]).toEqual(['test-component']);

        supply.off();
        expect([...await registry.sharers(share)]).toHaveLength(0);
      });
      it('registers sharer for aliased shares', async () => {

        const share2 = new ComponentShare('other-share', { aliases: share });
        const supply = share2.addSharer(defContext);

        expect([...await registry.sharers(share)]).toEqual(['test-component']);
        expect([...await registry.sharers(share2)]).toEqual(['test-component']);

        supply.off();
        expect([...await registry.sharers(share)]).toHaveLength(0);
        expect([...await registry.sharers(share2)]).toHaveLength(0);
      });
    });

    describe('shareValue', () => {

      let share2: ComponentShare<string>;

      beforeEach(() => {
        share2 = new ComponentShare('other-share', { aliases: share });
      });

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: Object },
        })
        class TestComponent {
        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      it('shares nothing by default', async () => {
        expect(await context.get(share)).toBeUndefined();
      });
      it('shares static value', async () => {
        defContext.perComponent(share.shareValue(() => 'test'));
        expect(await context.get(share)).toEqual('test');
      });
      it('shares updatable value', async () => {

        const value = trackValue('test1');

        defContext.perComponent(share.shareValue(() => value));
        expect(await context.get(share)).toEqual('test1');

        value.it = 'test2';
        expect(await context.get(share)).toEqual('test2');
      });
      it('shares static value for aliased shares', async () => {
        defContext.perComponent(share2.shareValue(() => 'test'));
        expect(await context.get(share)).toEqual('test');
        expect(await context.get(share2)).toEqual('test');
      });
      it('shares updatable value for aliased shares', async () => {

        const value = trackValue('test1');

        defContext.perComponent(share2.shareValue(() => value));
        expect(await context.get(share)).toEqual('test1');
        expect(await context.get(share2)).toEqual('test1');

        value.it = 'test2';
        expect(await context.get(share)).toEqual('test2');
        expect(await context.get(share2)).toEqual('test2');
      });
    });

    describe('selectValue', () => {

      let share2: ComponentShare<string>;
      let share3: ComponentShare<string>;

      beforeEach(() => {
        share2 = new ComponentShare('other-share', { aliases: share });
        share3 = new ComponentShare('third-share', { aliases: [share2, share] });
      });

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: Object },
        })
        class TestComponent {
        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      it('prefers explicitly shared value', async () => {

        const value1 = trackValue('test1');
        const value2 = trackValue('test2');

        defContext.perComponent(share.shareValue(() => value1));
        defContext.perComponent(share2.shareValue(() => value2));
        expect(await context.get(share)).toEqual('test1');
        expect(await context.get(share2)).toEqual('test2');

        value2.it = 'test2b';
        expect(await context.get(share)).toEqual('test1');
        expect(await context.get(share2)).toEqual('test2b');

        value1.it = 'test1b';
        expect(await context.get(share)).toEqual('test1b');
        expect(await context.get(share2)).toEqual('test2b');
      });
      it('prefers explicitly shared value despite the order of sharing', async () => {

        const value1 = trackValue('test1');
        const value2 = trackValue('test2');

        defContext.perComponent(share2.shareValue(() => value2));
        defContext.perComponent(share.shareValue(() => value1));
        expect(await context.get(share)).toEqual('test1');
        expect(await context.get(share2)).toEqual('test2');

        value2.it = 'test2b';
        expect(await context.get(share)).toEqual('test1');
        expect(await context.get(share2)).toEqual('test2b');

        value1.it = 'test1b';
        expect(await context.get(share)).toEqual('test1b');
        expect(await context.get(share2)).toEqual('test2b');
      });
      it('prefers shared value with earlier aliasing order', async () => {

        const value2 = trackValue('test2');
        const value3 = trackValue('test3');

        defContext.perComponent(share2.shareValue(() => value2));
        defContext.perComponent(share3.shareValue(() => value3));
        expect(await context.get(share)).toEqual('test2');
        expect(await context.get(share2)).toEqual('test2');
        expect(await context.get(share3)).toEqual('test3');

        value2.it = 'test2b';
        expect(await context.get(share)).toEqual('test2b');
        expect(await context.get(share2)).toEqual('test2b');
        expect(await context.get(share3)).toEqual('test3');

        value3.it = 'test3b';
        expect(await context.get(share)).toEqual('test2b');
        expect(await context.get(share2)).toEqual('test2b');
        expect(await context.get(share3)).toEqual('test3b');
      });
      it('prefers shared value with earlier aliasing order despite the order of sharing', async () => {

        const value2 = trackValue('test2');
        const value3 = trackValue('test3');

        defContext.perComponent(share3.shareValue(() => value3));
        defContext.perComponent(share2.shareValue(() => value2));
        expect(await context.get(share)).toEqual('test2');
        expect(await context.get(share2)).toEqual('test2');
        expect(await context.get(share3)).toEqual('test3');

        value2.it = 'test2b';
        expect(await context.get(share)).toEqual('test2b');
        expect(await context.get(share2)).toEqual('test2b');
        expect(await context.get(share3)).toEqual('test3');

        value3.it = 'test3b';
        expect(await context.get(share)).toEqual('test2b');
        expect(await context.get(share2)).toEqual('test2b');
        expect(await context.get(share3)).toEqual('test3b');
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
      let sharerMount: ComponentMount;
      let testEl: ComponentElement;
      let testCtx: ComponentContext;

      beforeEach(() => {
        sharerEl = document.createElement('sharer-el');
        sharerMount = sharerDefContext.mountTo(sharerEl);

        testEl = sharerEl.appendChild(document.createElement('test-el'));
        testCtx = testDefContext.mountTo(testEl).context;
      });

      it('reports nothing without sharer registered', async () => {
        sharerDefContext.perComponent(share.shareValue(() => 'test'));
        expect(await share.valueFor(testCtx)).toBeUndefined();
      });
      it('reports value shared by parent sharer', async () => {
        share.addSharer(sharerDefContext, 'sharer-el');
        sharerDefContext.perComponent(share.shareValue(() => 'test'));

        const shared = share.valueFor(testCtx);

        expect(await shared).toBe('test');
        sharerMount.connect();
        expect(await shared).toBe('test');
      });
    });
  });
});
