import { AfterEvent } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { BootstrapContext, Component, DefinitionContext } from '@wesib/wesib';
import { testDefinition } from '../spec/test-element';
import { ComponentShare } from './component-share';
import { ComponentShareRegistry } from './component-share-registry.impl';
import { Shared } from './shared.decorator';

describe('share', () => {
  describe('ComponentShareRegistry', () => {

    let share: ComponentShare<string>;

    beforeEach(() => {
      share = new ComponentShare('test-share');
    });

    describe('@Shared', () => {

      let bsContext: BootstrapContext;
      let sharers: AfterEvent<[ReadonlySet<string>]>;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {

          @Shared(share)
          sharedValue = 'test';

        }

        const defContext = await testDefinition(TestComponent);

        bsContext = defContext.get(BootstrapContext);

        const registry = bsContext.get(ComponentShareRegistry);

        sharers = registry.sharers(share);
      });

      it('registers sharer component name', async () => {
        expect([...await sharers]).toEqual(['test-component']);
      });
      it('registers multiple sharer components', async () => {

        @Component('test-component2')
        class TestComponent2 {

          @Shared(share)
          sharedValue = 'test2';

        }

        await bsContext.load(TestComponent2).whenReady;

        expect([...await sharers]).toEqual(['test-component', 'test-component2']);
      });
      it('does not register sharer for anonymous component', async () => {

        @Component()
        class TestComponent2 {

          @Shared(share)
          sharedValue = 'test2';

        }

        await bsContext.load(TestComponent2).whenReady;

        expect([...await sharers]).toEqual(['test-component']);
      });
    });

    describe('sharers', () => {

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

      it('is initially empty', async () => {
        expect([...await registry.sharers(share)]).toHaveLength(0);
      });

      describe('addSharer', () => {
        it('registers sharer', async () => {

          const supply = new Supply();

          registry.addSharer(share, 'test-component', supply);
          expect([...await registry.sharers(share)]).toEqual(['test-component']);

          supply.off();
          expect([...await registry.sharers(share)]).toHaveLength(0);
        });
      });

    });
  });
});
